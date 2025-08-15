import dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@redis/client'
import express from 'express'
import http from 'http'

import { parsedQuestionSubmission } from '@repo/commons/types'
import prisma from '@repo/db/client'
import { Judge0ConnectionManager, Status, Judge0Submission } from './Judge0ConnectionManager'

interface SubmissionMessage {
    userId: string
    problemId: string
    code: string
    lang: string
    submissionId: string
}

interface ExecutionResult {
    success: boolean
    output?: string
    error?: string
    runtime?: number
    memory?: number
    status: Status
    testResults?: Array<{
        testCaseId: number
        isVisible: boolean
        status: Status
        output?: string
        error?: string
        runtime?: number
        memory?: number
        expected?: string
        actual?: string
    }>
}

class OptimusWorker {
    private redisClient
    private redisPublisher
    private judge0Service: Judge0ConnectionManager
    private isRunning = false
    private isConnected = false
    private app: express.Express
    private server!: http.Server

    constructor() {
        // Check if we're in development mode
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev'
        if (isDevelopment) {
            console.log('🔄 DEVELOPMENT MODE: Database submissions will be skipped')
        }
        
        // Build Redis URL with password if available
        const redisHost = process.env.REDIS_HOST || 'localhost'
        const redisPort = process.env.REDIS_PORT || '6379'
        const redisPassword = process.env.REDIS_PASSWORD
        
        let redisUrl = `redis://${redisHost}:${redisPort}`
        if (redisPassword) {
            redisUrl = `redis://:${redisPassword}@${redisHost}:${redisPort}`
        }
        
        // In development mode, allow Redis without password
        if (isDevelopment && !redisPassword) {
            console.log('🔄 Development mode: Connecting to Redis without password')
        }
        
        this.redisClient = createClient({
            url: redisUrl
        })
        this.redisPublisher = createClient({
            url: redisUrl
        })
        this.judge0Service = new Judge0ConnectionManager()
        
        // Setup Express app for health checks
        this.app = express()
        this.setupHealthEndpoint()
        
        this.setupEventListeners()
    }

    private setupHealthEndpoint() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                redis: this.isConnected ? 'connected' : 'disconnected',
                worker: this.isRunning ? 'running' : 'stopped'
            }
            
            if (this.isConnected && this.isRunning) {
                res.status(200).json(health)
            } else {
                res.status(503).json({ ...health, status: 'unhealthy' })
            }
        })

        // Start HTTP server for health checks
        const port = process.env.PORT || 3002
        this.server = this.app.listen(port, () => {
            console.log(`🏥 Health check server running on port ${port}`)
        })
    }

    private setupEventListeners() {
        this.redisClient.on('connect', () => {
            console.log('✅ Optimus Worker Redis client connected')
            this.isConnected = true
        })

        this.redisClient.on('error', (err) => {
            console.error('❌ Optimus Worker Redis client error:', err)
            this.isConnected = false
        })

        this.redisPublisher.on('connect', () => {
            console.log('✅ Optimus Worker Redis publisher connected')
        })

        this.redisPublisher.on('error', (err) => {
            console.error('❌ Optimus Worker Redis publisher error:', err)
        })
    }

    async start() {
        try {
            await this.redisClient.connect()
            await this.redisPublisher.connect()
            
            console.log('🚀 Optimus Worker started')
            console.log('📡 Connected to Redis')
            console.log('⚖️ Using Judge0 Connection Manager with fallback support')
            
            this.isRunning = true
            await this.startMessageConsumer()
        } catch (error) {
            console.error('❌ Failed to start Optimus Worker:', error)
            process.exit(1)
        }
    }

    private async startMessageConsumer() {
        while (this.isRunning) {
            try {
                if (!this.isConnected) {
                    console.log('⚠️ Redis not connected, waiting...')
                    await new Promise(resolve => setTimeout(resolve, 5000))
                    continue
                }

                // Pop message from the queue
                const message = await this.redisClient.brPop('messages', 1)
                
                if (message) {
                    const submissionData = JSON.parse(message.element) as SubmissionMessage
                    console.log(`📥 Processing submission: ${submissionData.submissionId}`)
                    
                    // Process the submission asynchronously
                    this.processSubmission(submissionData).catch(error => {
                        console.error(`❌ Error processing submission ${submissionData.submissionId}:`, error)
                    })
                }
            } catch (error) {
                console.error('❌ Error in message consumer:', error)
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }
    }

    private async processSubmission(submission: SubmissionMessage) {
        const startTime = Date.now()
        
        try {
            const validation = parsedQuestionSubmission.safeParse({
                problemId: submission.problemId,
                userId: submission.userId,
                code: submission.code,
                lang: submission.lang
            })

            if (!validation.success) {
                throw new Error('Invalid submission data')
            }

            const question = await prisma.question.findUnique({
                where: { id: submission.problemId },
                include: {
                    testcases: {
                        include: {
                            testCaseInputs: true
                        }
                    },
                    templateCodes: true
                }
            })

            if (!question) {
                throw new Error('Question not found')
            }

            // Execute code against test cases using Judge0
            const result = await this.executeCodeWithJudge0(submission, question.testcases)
            
            // Calculate runtime
            const runtime = Date.now() - startTime
            
            // Save submission to database (skip in development mode)
            if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'dev') {
                await this.saveSubmission(submission, result, runtime)
            } else {
                console.log('🔄 Development mode: Skipping database submission save')
            }
            
            // Send result back through Redis
            await this.sendResult(submission.submissionId, {
                id: submission.submissionId,
                status: result.status,
                testResults: result.testResults || []
            })

            console.log(`✅ Submission ${submission.submissionId} processed successfully`)
            
        } catch (error: any) {
            console.error(`❌ Error processing submission ${submission.submissionId}:`, error)
            
            // Send error result back
            await this.sendResult(submission.submissionId, {
                id: submission.submissionId,
                status: Status.RE,
                testResults: []
            })
        }
    }

    private async executeCodeWithJudge0(submission: SubmissionMessage, testCases: any[]): Promise<ExecutionResult> {
        try {
            // Execute against each test case and collect detailed results
            const perTestResults: ExecutionResult['testResults'] = []

            for (const testCase of testCases) {
                const result = await this.runTestCaseWithJudge0(submission, testCase)

                // Prepare expected output string for reporting
                let expectedOutput = ''
                if (testCase.expected !== undefined && testCase.expected !== null) {
                    if (typeof testCase.expected === 'string') {
                        expectedOutput = testCase.expected
                    } else if (typeof testCase.expected === 'number') {
                        expectedOutput = testCase.expected.toString()
                    } else if (Array.isArray(testCase.expected)) {
                        expectedOutput = testCase.expected.join('\n')
                    } else {
                        expectedOutput = JSON.stringify(testCase.expected)
                    }
                }

                perTestResults.push({
                    testCaseId: testCase.id,
                    isVisible: Boolean(testCase.isVisible),
                    status: result.status,
                    output: result.output,
                    error: result.error,
                    runtime: result.runtime,
                    memory: result.memory,
                    expected: expectedOutput?.trim?.() ?? '',
                    actual: result.output?.trim?.() ?? ''
                })
            }

            // Derive overall status prioritizing non-AC statuses
            const hasRE = perTestResults.some(r => r.status === Status.RE)
            const hasCE = perTestResults.some(r => r.status === Status.CE)
            const hasTLE = perTestResults.some(r => r.status === Status.TLE)
            const hasWA = perTestResults.some(r => r.status === Status.WA)

            let overallStatus: Status = Status.AC
            if (hasRE) overallStatus = Status.RE
            else if (hasCE) overallStatus = Status.CE
            else if (hasTLE) overallStatus = Status.TLE
            else if (hasWA) overallStatus = Status.WA

            return {
                success: overallStatus === Status.AC,
                status: overallStatus,
                testResults: perTestResults
            }
            
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                status: Status.RE
            }
        }
    }

    private modifyCodeForTestCases(code: string, lang: string, testCaseInputs: any[]): string {
        if (lang.toLowerCase() === 'javascript' || lang.toLowerCase() === 'js') {
            return this.generateJavaScriptDriver(code);
        } else if (lang.toLowerCase() === 'python' || lang.toLowerCase() === 'py') {
            return this.generatePythonDriver(code);
        } else if (lang.toLowerCase() === 'cpp' || lang.toLowerCase() === 'c++') {
            return this.generateCppDriver(code);
        } else if (lang.toLowerCase() === 'java') {
            return this.generateJavaDriver(code);
        }
        
        return code;
    }

    private generateJavaScriptDriver(code: string): string {
        // Improved function extraction for JavaScript
        // Handle both function declarations and arrow functions
        let functionMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}/);
        
        if (!functionMatch) {
            // Try arrow function pattern
            functionMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*)\}/);
        }
        
        if (!functionMatch) {
            // Try function expression pattern
            functionMatch = code.match(/(\w+)\s*:\s*function\s*\(([^)]*)\)\s*\{([\s\S]*)\}/);
        }
        
        if (!functionMatch) {
            return code;
        }

        const functionName = functionMatch[1];
        const params = functionMatch[2] ? functionMatch[2].split(',').map(p => p.trim()) : [];
        const functionBody = functionMatch[3];

        return `
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ${functionName}(${params.join(', ')}) {
${functionBody}
}

rl.on('line', (input) => {
    try {
        const parts = input.trim().split(' ');
        ${this.generateJavaScriptInputParsing(params)}
        
        const result = ${functionName}(${this.generateJavaScriptFunctionCall(params)});
        
        // Format output based on result type
        if (Array.isArray(result)) {
            // For arrays like [0, 1], print each element on a new line
            result.forEach(item => console.log(item));
        } else {
            console.log(result);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
    }
});`;
    }

    private generateJavaScriptInputParsing(params: string[]): string {
        if (params.length === 1) {
            const param = params[0];
            if (param && (param.includes('str') || param.includes('s'))) {
                return `const ${param} = parts[0];`;
            } else if (param) {
                return `const ${param} = Number(parts[0]);`;
            }
        } else if (params.length === 2) {
            const param1 = params[0];
            const param2 = params[1];
            
            if (param1 && (param1.includes('arr') || param1.includes('nums'))) {
                return `const ${param1} = parts.slice(0, -1).map(Number);
const ${param2} = Number(parts[parts.length - 1]);`;
            } else if (param1 && (param1.includes('str') || param1.includes('s'))) {
                return `const ${param1} = parts[0];
const ${param2} = parts[1];`;
            } else if (param1 && param2) {
                return `const ${param1} = Number(parts[0]);
const ${param2} = Number(parts[1]);`;
            }
        }
        return params.map((param, i) => {
            if (param && (param.includes('str') || param.includes('s'))) {
                return `const ${param} = parts[${i}];`;
            } else if (param) {
                return `const ${param} = Number(parts[${i}]);`;
            }
            return '';
        }).filter(Boolean).join('\n        ');
    }

    private generateJavaScriptFunctionCall(params: string[]): string {
        return params.join(', ');
    }

    private generatePythonDriver(code: string): string {
        // Improved Python function extraction - handle type hints
        let functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*->\s*[^:]*:\s*\n([\s\S]*)/);
        
        if (!functionMatch) {
            // Try without return type hint
            functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*\n([\s\S]*)/);
        }
        
        if (!functionMatch) {
            // Try alternative pattern for single function
            functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*([\s\S]*)/);
        }
        
        if (functionMatch && functionMatch[1] && functionMatch[2] && functionMatch[3]) {
            const functionName = functionMatch[1];
            const params = functionMatch[2].split(',').map(p => p.trim());
            const functionBody = functionMatch[3];
            
            return this.generateCompletePythonDriver(functionName, params, functionBody);
        }
        
        return code;
    }

    private generateCompletePythonDriver(functionName: string, params: string[], functionBody: string): string {
        // Clean function parameters to remove type hints
        const cleanParams = params.map(p => {
            if (p.includes(':')) {
                return p.split(':')[0]?.trim() || p.trim();
            }
            return p.trim();
        });
        
        return `def ${functionName}(${cleanParams.join(', ')}):
${functionBody}

# Read input from stdin
import sys

try:
    # Read input line
    input_line = sys.stdin.readline().strip()
    parts = input_line.split()
    
    ${this.generatePythonInputParsing(params)}
    
    # Call the function
    result = ${functionName}(${this.generatePythonFunctionCall(params)})
    
    # Format output based on result type
    if result is None:
        print("None")
    elif isinstance(result, list):
        # For arrays like [0, 1], print each element on a new line
        for item in result:
            print(item)
    elif isinstance(result, bool):
        print(str(result))
    elif isinstance(result, (int, float)):
        print(result)
    else:
        print(str(result))
        
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)`;
    }

    private generatePythonInputParsing(params: string[]): string {
        // Extract parameter names without type hints
        const cleanParams = params.map(p => {
            // Handle type hints like "nums: List[int]" -> extract "nums"
            if (p.includes(':')) {
                return p.split(':')[0]?.trim();
            }
            return p.trim();
        });
        
        if (cleanParams.length === 1) {
            const param = cleanParams[0];
            if (param && (param.includes('arr') || param.includes('nums'))) {
                return `${param} = [int(x) for x in parts]`;
            } else if (param && (param.includes('str') || param.includes('s'))) {
                return `${param} = parts[0]`;
            } else if (param) {
                return `${param} = int(parts[0])`;
            }
        } else if (cleanParams.length === 2) {
            const param1 = cleanParams[0];
            const param2 = cleanParams[1];
            
            if (param1 && (param1.includes('arr') || param1.includes('nums'))) {
                return `${param1} = [int(x) for x in parts[:-1]]
    ${param2} = int(parts[-1])`;
            } else if (param1 && (param1.includes('str') || param1.includes('s'))) {
                return `${param1} = parts[0]
    ${param2} = parts[1]`;
            } else if (param1 && param2) {
                return `${param1} = int(parts[0])
    ${param2} = int(parts[1])`;
            }
        }
        
        // Fallback for any remaining cases
        return cleanParams.map((param, i) => {
            if (param && (param.includes('str') || param.includes('s'))) {
                return `${param} = parts[${i}]`;
            } else if (param) {
                return `${param} = int(parts[${i}])`;
            }
            return '';
        }).filter(Boolean).join('\n    ');
    }

    private generatePythonFunctionCall(params: string[]): string {
        // Extract parameter names without type hints
        const cleanParams = params.map(p => {
            // Handle type hints like "nums: List[int]" -> extract "nums"
            if (p.includes(':')) {
                return p.split(':')[0]?.trim() || p.trim();
            }
            return p.trim();
        });
        return cleanParams.join(', ');
    }

    private generateCppDriver(code: string): string {
        // First, check if this is a class-based solution
        if (code.includes('class Solution')) {
            // Look for class Solution with method - use a simpler approach
            
            // First, find the class Solution
            const classStart = code.indexOf('class Solution');
            if (classStart === -1) {
                return code;
            }
            
            // Find the public section
            const publicStart = code.indexOf('public:', classStart);
            if (publicStart === -1) {
                return code;
            }
            
            // Find the method signature after public:
            const methodSignatureMatch = code.substring(publicStart).match(/(\S+)\s+(\w+)\s*\(([^)]*)\)\s*\{/);
            
            if (methodSignatureMatch && methodSignatureMatch[1] && methodSignatureMatch[2] && methodSignatureMatch[3]) {
                const returnType = methodSignatureMatch[1];
                const functionName = methodSignatureMatch[2];
                const params = methodSignatureMatch[3].split(',').map(p => p.trim());
                
                // Find the opening brace after the method signature
                const methodStart = code.indexOf(`{`, publicStart + methodSignatureMatch[0].length - 1);
                if (methodStart === -1) {
                    return code;
                }
                
                // Find the closing brace by counting braces
                let braceCount = 1;
                let methodEnd = methodStart + 1;
                for (let i = methodStart + 1; i < code.length; i++) {
                    if (code[i] === '{') braceCount++;
                    else if (code[i] === '}') braceCount--;
                    if (braceCount === 0) {
                        methodEnd = i;
                        break;
                    }
                }
                
                // Extract function body without the closing brace
                const functionBody = code.substring(methodStart + 1, methodEnd - 1);
                
                return this.generateCppDriverCode(returnType, functionName, params, functionBody);
            }
            
            return code;
        }
        
        // If not a class, try to extract standalone functions
        let functionMatch = code.match(/(\S+)\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}/);
        
        // Filter out main function and find the first non-main function
        if (functionMatch && functionMatch[2] === 'main') {
            // Try to find another function
            const allMatches = [...code.matchAll(/(\S+)\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}/g)];
            for (const match of allMatches) {
                if (match[2] !== 'main') {
                    functionMatch = match;
                    break;
                }
            }
        }
        
        if (!functionMatch || !functionMatch[1] || !functionMatch[2] || !functionMatch[3] || !functionMatch[4]) {
            return code;
        }

        const returnType = functionMatch[1];
        const functionName = functionMatch[2];
        const params = functionMatch[3].split(',').map(p => p.trim());
        const functionBody = functionMatch[4];

        return this.generateCppDriverCode(returnType, functionName, params, functionBody);
    }

    private generateCppDriverCode(returnType: string, functionName: string, params: string[], functionBody: string): string {
        return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <unordered_map>
using namespace std;

${returnType} ${functionName}(${params.join(', ')}) {
${functionBody}
}

int main() {
    string input;
    getline(cin, input);
    
    stringstream ss(input);
    string token;
    vector<string> tokens;
    
    // Parse input tokens
    while (ss >> token) {
        tokens.push_back(token);
    }
    
    ${this.generateCppInputParsing(params)}
    
    ${returnType} result = ${functionName}(${this.generateCppFunctionCall(params)});
    
    // Format output based on result type
    if (result.empty()) {
        cout << "No solution found" << endl;
    } else {
        // Output each element on a new line for vectors
        for (int i = 0; i < result.size(); i++) {
            cout << result[i] << endl;
        }
    }
    
    return 0;
}`;
    }

    private generateCppInputParsing(params: string[]): string {
        if (params.length === 1) {
            const param = params[0];
            if (param && param.includes('vector')) {
                const paramName = param.split(' ').pop() || 'nums';
                return `vector<int> ${paramName} = vector<int>(tokens.begin(), tokens.end());`;
            } else if (param && (param.includes('str') || param.includes('s'))) {
                const paramName = param.split(' ').pop() || 'str';
                return `string ${paramName} = tokens[0];`;
            } else if (param) {
                const paramName = param.split(' ').pop() || 'num';
                return `int ${paramName} = stoi(tokens[0]);`;
            }
        } else if (params.length === 2) {
            const param1 = params[0];
            const param2 = params[1];
            
            if (param1 && param1.includes('vector')) {
                const param1Name = param1.split(' ').pop() || 'nums';
                const param2Name = param2?.split(' ').pop() || 'target';
                return `vector<int> ${param1Name};
for (int i = 0; i < tokens.size() - 1; i++) {
    ${param1Name}.push_back(stoi(tokens[i]));
}
int ${param2Name} = stoi(tokens[tokens.size() - 1]);`;
            } else if (param1 && (param1.includes('str') || param1.includes('s'))) {
                const param1Name = param1.split(' ').pop() || 'str1';
                const param2Name = param2?.split(' ').pop() || 'str2';
                return `string ${param1Name} = tokens[0];
string ${param2Name} = tokens[1];`;
            } else if (param1 && param2) {
                const param1Name = param1.split(' ').pop() || 'num1';
                const param2Name = param2?.split(' ').pop() || 'num2';
                return `int ${param1Name} = stoi(tokens[0]);
int ${param2Name} = stoi(tokens[1]);`;
            }
        }
        return params.map((param, i) => {
            if (param && param.includes('vector')) {
                const paramName = param.split(' ').pop() || `nums${i}`;
                return `vector<int> ${paramName};
for (int j = 0; j < tokens.size(); j++) {
    ${paramName}.push_back(stoi(tokens[j]));
}`;
            } else if (param && (param.includes('str') || param.includes('s'))) {
                const paramName = param.split(' ').pop() || `str${i}`;
                return `string ${paramName} = tokens[${i}];`;
            } else if (param) {
                const paramName = param.split(' ').pop() || `num${i}`;
                return `int ${paramName} = stoi(tokens[${i}]);`;
            }
            return '';
        }).filter(Boolean).join('\n    ');
    }

    private generateCppFunctionCall(params: string[]): string {
        return params.map(param => param.split(' ').pop() || 'param').join(', ');
    }

    private generateJavaDriver(code: string): string {
        // Extract the Solution class and its method
        const classMatch = code.match(/public class Solution\s*\{[\s\S]*?\}/);
        
        if (!classMatch) {
            return code;
        }

        // Extract the method signature and body
        const methodMatch = code.match(/public\s+(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{[\s\S]*?\}/);
        
        if (!methodMatch) {
            return code;
        }

        const returnType = methodMatch[1];
        const methodName = methodMatch[2];
        const params = methodMatch[3] ? methodMatch[3].split(',').map(p => p.trim()) : [];
        
        if (!returnType || !methodName) {
            return code;
        }

        // Extract the entire method body - use a simpler approach
        const methodStart = code.indexOf(`public ${returnType} ${methodName}(`);
        if (methodStart === -1) {
            return code;
        }
        
        // Find the opening brace after the method signature
        const signatureEnd = code.indexOf('{', methodStart);
        if (signatureEnd === -1) {
            return code;
        }
        
        // Find the closing brace by counting braces
        let braceCount = 1;
        let methodEnd = signatureEnd + 1;
        for (let i = signatureEnd + 1; i < code.length; i++) {
            if (code[i] === '{') braceCount++;
            else if (code[i] === '}') braceCount--;
            if (braceCount === 0) {
                methodEnd = i;
                break;
            }
        }
        
        const methodBody = code.substring(signatureEnd + 1, methodEnd);

        // Generate parameter reading code based on parameter types
        // Read all input on a single line and parse it
        const readInputsCode = `        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        String[] parts = input.split(" ");
        
        ${params.map((param, i) => {
            const paramParts = param.trim().split(' ');
            const paramType = paramParts[0];
            const paramName = paramParts[paramParts.length - 1];
            
            if (!paramType || !paramName) {
                return '';
            }
            
            if (paramType === 'int[]' || paramType === 'String[]') {
                return `        ${paramType} ${paramName} = new ${paramType}[parts.length];
        for (int i = 0; i < parts.length; i++) {
            ${paramType === 'int[]' ? `${paramName}[i] = Integer.parseInt(parts[i]);` : `${paramName}[i] = parts[i];`}
        }`;
            } else if (paramType === 'int') {
                return `        int ${paramName} = Integer.parseInt(parts[${i}]);`;
            } else if (paramType === 'String') {
                return `        String ${paramName} = parts[${i}];`;
            } else if (paramType === 'boolean') {
                return `        boolean ${paramName} = Boolean.parseBoolean(parts[${i}]);`;
            } else if (paramType === 'double') {
                return `        double ${paramName} = Double.parseDouble(parts[${i}]);`;
            } else {
                return `        ${paramType} ${paramName} = ${paramType}.valueOf(parts[${i}]);`;
            }
        }).filter(code => code !== '').join('\n')}`;

        // Generate the main method
        const mainMethod = `    public static void main(String[] args) {
${readInputsCode}
        
        Main solution = new Main();
        ${returnType} result = solution.${methodName}(${params.map(p => p.trim().split(' ').pop()).join(', ')});
        
        // Handle different return types for output
        if (result instanceof int[]) {
            System.out.println(Arrays.toString(result));
        } else if (result instanceof String[]) {
            System.out.println(Arrays.toString(result));
        } else {
            System.out.println(result);
        }
    }`;

        // Return the complete Java program
        const generatedCode = `import java.util.*;
import java.util.Arrays;

public class Main {
    public ${returnType} ${methodName}(${params.join(', ')}) {
${methodBody}
    }
    
${mainMethod}
}`;
        
        return generatedCode;
    }

    private async runTestCaseWithJudge0(submission: SubmissionMessage, testCase: any): Promise<ExecutionResult> {
        try {
            const languageId = this.judge0Service.getLanguageId(submission.lang)
            
            // Prepare input data from test case
            let stdin = ''
            
            // Handle test case inputs based on the schema
            if (testCase.testCaseInputs && testCase.testCaseInputs.length > 0) {
                // Sort by position and extract values
                const sortedInputs = testCase.testCaseInputs.sort((a: any, b: any) => a.position - b.position);
                
                // Format input based on the problem type
                // For Two Sum: first input is nums array, second is target
                if (sortedInputs.length === 2 && Array.isArray(sortedInputs[0].value)) {
                    // Two Sum format: [nums_array, target]
                    const numsArray = sortedInputs[0].value;
                    const target = sortedInputs[1].value;
                    // Send as: "nums_array target" (space-separated)
                    stdin = `${numsArray.join(' ')} ${target}`;
                } else {
                    // General case: space-separated values
                    stdin = sortedInputs
                        .map((input: any) => {
                            if (typeof input.value === 'string') {
                                return input.value;
                            } else if (typeof input.value === 'number') {
                                return input.value.toString();
                            } else if (Array.isArray(input.value)) {
                                return input.value.join(' ');
                            } else {
                                return input.value.toString();
                            }
                        })
                        .join(' ');
                }
            } else if (testCase.inputs) {
                // Fallback to the inputs field if testCaseInputs is not available
                if (typeof testCase.inputs === 'string') {
                    stdin = testCase.inputs;
                } else if (Array.isArray(testCase.inputs)) {
                    stdin = testCase.inputs.join(' ');
                } else if (typeof testCase.inputs === 'object' && testCase.inputs !== null) {
                    stdin = Object.values(testCase.inputs).join(' ');
                } else {
                    stdin = testCase.inputs.toString();
                }
            }

            // Prepare expected output
            let expectedOutput = '';
            if (testCase.expected !== undefined && testCase.expected !== null) {
                if (typeof testCase.expected === 'string') {
                    expectedOutput = testCase.expected;
                } else if (typeof testCase.expected === 'number') {
                    expectedOutput = testCase.expected.toString();
                } else if (Array.isArray(testCase.expected)) {
                    // For arrays like [0,1], format to match code output
                    // All languages now output arrays with each element on a new line for consistency
                    expectedOutput = testCase.expected.join('\n');
                } else {
                    expectedOutput = JSON.stringify(testCase.expected);
                }
            }

            const modifiedCode = this.modifyCodeForTestCases(submission.code, submission.lang, testCase.testCaseInputs || [])
            
            // Remove expected_output to avoid 422 errors - we'll compare manually
            // Ensure languageId is a number
            const numericLanguageId = Number(languageId)
            if (isNaN(numericLanguageId)) {
                throw new Error(`Invalid language ID: ${languageId}`)
            }
            
            const judge0Submission: Judge0Submission = {
                source_code: modifiedCode,
                language_id: numericLanguageId,
                stdin: stdin,
                // expected_output: expectedOutput, // Removed - causes 422 errors with Judge0 Extra CE
                cpu_time_limit: 5, // 5 seconds
                memory_limit: 512000 // 512MB
            }

            let result: any
            try {
                const token = await this.judge0Service.submitCode(judge0Submission)
                
                // Wait for result
                result = await this.judge0Service.waitForResult(token)
            } catch (error) {
                throw error
            }
            
            const judge0Status = this.judge0Service.getStatusFromJudge0(result.status.id)
            
            // Check if Judge0 execution was successful
            if (judge0Status !== Status.AC) {
                return {
                    success: false,
                    output: result.stdout || '',
                    error: result.stderr || result.compile_output || '',
                    runtime: result.time ? parseFloat(result.time) * 1000 : undefined,
                    memory: result.memory,
                    status: judge0Status
                }
            }
            
            // Judge0 execution was successful, now check if output matches expected
            const actualOutput = (result.stdout || '').trim()
            const expectedOutputStr = expectedOutput.trim()
            
            if (actualOutput !== expectedOutputStr) {
                return {
                    success: false,
                    output: actualOutput,
                    error: '',
                    runtime: result.time ? parseFloat(result.time) * 1000 : undefined,
                    memory: result.memory,
                    status: Status.WA
                }
            }
            
            return {
                success: true,
                output: actualOutput,
                error: '',
                runtime: result.time ? parseFloat(result.time) * 1000 : undefined,
                memory: result.memory,
                status: Status.AC
            }
            
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Runtime error',
                status: Status.RE
            }
        }
    }

    private async saveSubmission(submission: SubmissionMessage, result: ExecutionResult, runtime: number) {
        // Skip saving in development mode
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
            console.log('🔄 Development mode: Skipping database submission save')
            return
        }
        
        try {
            await prisma.submission.create({
                data: {
                    id: submission.submissionId,
                    userId: submission.userId,
                    questionId: submission.problemId,
                    codeText: submission.code,
                    status: String(result.status),
                    language: submission.lang,
                    runtime: runtime
                }
            })
            console.log('✅ Submission saved to database successfully')
        } catch (error) {
            console.error('Failed to save submission to database:', error)
            // Don't throw error to avoid breaking the submission flow
        }
    }

    private async sendResult(submissionId: string, result: any) {
        try {
            await this.redisPublisher.publish(submissionId, JSON.stringify(result))
        } catch (error) {
            console.error('Failed to send result:', error)
        }
    }

    async stop() {
        this.isRunning = false
        await this.redisClient.disconnect()
        await this.redisPublisher.disconnect()
        console.log('🛑 Optimus Worker stopped')
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    await worker.stop()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
    await worker.stop()
    process.exit(0)
})

// Start the worker
const worker = new OptimusWorker()
worker.start().catch(error => {
    console.error('❌ Failed to start worker:', error)
    process.exit(1)
})
