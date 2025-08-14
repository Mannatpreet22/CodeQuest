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
        // Build Redis URL with password if available
        const redisHost = process.env.REDIS_HOST || 'localhost'
        const redisPort = process.env.REDIS_PORT || '6379'
        const redisPassword = process.env.REDIS_PASSWORD
        
        let redisUrl = `redis://${redisHost}:${redisPort}`
        if (redisPassword) {
            redisUrl = `redis://:${redisPassword}@${redisHost}:${redisPort}`
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
        const port = process.env.PORT || 3001
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
            
            // Save submission to database
            await this.saveSubmission(submission, result, runtime)
            
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
        console.log('🔍 modifyCodeForTestCases called with language:', lang);
        console.log('🔍 Language lowercase:', lang.toLowerCase());
        
        if (lang.toLowerCase() === 'javascript' || lang.toLowerCase() === 'js') {
            console.log('🔍 Generating JavaScript driver');
            return this.generateJavaScriptDriver(code);
        } else if (lang.toLowerCase() === 'python' || lang.toLowerCase() === 'py') {
            console.log('🔍 Generating Python driver');
            return this.generatePythonDriver(code);
        } else if (lang.toLowerCase() === 'cpp' || lang.toLowerCase() === 'c++') {
            console.log('🔍 Generating C++ driver');
            return this.generateCppDriver(code);
        } else if (lang.toLowerCase() === 'java') {
            console.log('🔍 Generating Java driver');
            return this.generateJavaDriver(code);
        }
        
        console.log('🔍 No driver generated, returning original code');
        return code;
    }

    private generateJavaScriptDriver(code: string): string {
        // Extract function definition
        const functionMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)\s*\{[\s\S]*?\}/);
        
        if (!functionMatch) {
            console.log('⚠️ Could not extract JavaScript function, using original code');
            return code;
        }

        const functionName = functionMatch[1];
        const params = functionMatch[2] ? functionMatch[2].split(',').map(p => p.trim()) : [];
        const functionBody = functionMatch[0];
        
        console.log('🔍 Extracted JavaScript function:', functionName);
        console.log('🔍 Parameters:', params);

        return `
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

${functionBody}

rl.on('line', (input) => {
    const values = input.split(' ').map(Number);
    const result = ${functionName}(${params.map((_, i) => `values[${i}]`).join(', ')});
    console.log(result);
    rl.close();
});`;
    }

    private generatePythonDriver(code: string): string {
        // Extract function definition with more flexible regex
        const functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*\n([\s\S]*?)(?=\n\s*(?:#|print|def\s+\w+\s*\(|$))/);
        
        if (!functionMatch) {
            // Try a simpler regex if the first one fails
            const simpleMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*\n([\s\S]*)/);
            
            if (!simpleMatch) {
                console.log('⚠️ Could not extract Python function, using original code');
                return code;
            }
            
            const functionName = simpleMatch[1];
            const params = simpleMatch[2] ? simpleMatch[2].split(',').map(p => p.trim()) : [];
            let functionBody = simpleMatch[3] || '';
            
            // Fix indentation if needed
            const lines = functionBody.split('\n');
            const fixedLines = lines.map(line => {
                if (line.trim() && !line.startsWith(' ')) {
                    return '    ' + line; // Add proper indentation
                }
                return line;
            });
            functionBody = fixedLines.join('\n');
            
            console.log('🔍 Extracted Python function (simple):', functionName);
            console.log('🔍 Parameters:', params);
            console.log('🔍 Function body:', functionBody);

            return `def ${functionName}(${params.join(', ')}):
${functionBody}

# Read input from stdin
import sys
import json
input_data = sys.stdin.read().strip()

# Parse input based on parameter types
${params.map((param, i) => {
    const paramName = param.trim();
    // Check if parameter name suggests it's an array OR if it's the first parameter (likely nums)
    if (paramName.includes('arr') || paramName.includes('list') || paramName.includes('array') || paramName.includes('nums') || i === 0) {
        return `${paramName} = json.loads(input_data)`;
    } else {
        return `${paramName} = int(input_data.split()[${i}])`;
    }
}).join('\n')}

# Call the function with the input
result = ${functionName}(${params.map(p => p.trim()).join(', ')})
# Format output as expected by Judge0 (each element on a new line for arrays)
if isinstance(result, list):
    for item in result:
        print(item)
else:
    print(result)`;
        }

        const functionName = functionMatch[1];
        const params = functionMatch[2] ? functionMatch[2].split(',').map(p => p.trim()) : [];
        let functionBody = functionMatch[3] || '';
        
        // Fix indentation if needed
        const lines = functionBody.split('\n');
        const fixedLines = lines.map(line => {
            if (line.trim() && !line.startsWith(' ')) {
                return '    ' + line; // Add proper indentation
            }
            return line;
        });
        functionBody = fixedLines.join('\n');
        
        console.log('🔍 Extracted Python function:', functionName);
        console.log('🔍 Parameters:', params);
        console.log('🔍 Function body:', functionBody);

        return `def ${functionName}(${params.join(', ')}):
${functionBody}

# Read input from stdin
import sys
import json
input_data = sys.stdin.read().strip()

# Parse input based on parameter types
${params.map((param, i) => {
    const paramName = param.trim();
    // Check if parameter name suggests it's an array OR if it's the first parameter (likely nums)
    if (paramName.includes('arr') || paramName.includes('list') || paramName.includes('array') || paramName.includes('nums') || i === 0) {
        return `${paramName} = json.loads(input_data)`;
    } else {
        return `${paramName} = int(input_data.split()[${i}])`;
    }
}).join('\n')}

# Call the function with the input
result = ${functionName}(${params.map(p => p.trim()).join(', ')})
# Format output as expected by Judge0 (each element on a new line for arrays)
if isinstance(result, list):
    for item in result:
        print(item)
else:
    print(result)`;
    }

    private generateCppDriver(code: string): string {
        // Extract function definition (excluding main function)
        const functionMatch = code.match(/(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{[\s\S]*?\}(?=\s*\n\s*\n|\s*$)/);
        
        if (!functionMatch) {
            console.log('⚠️ Could not extract C++ function, using original code');
            return code;
        }

        const returnType = functionMatch[1];
        const functionName = functionMatch[2];
        const params = functionMatch[3] ? functionMatch[3].split(',').map(p => p.trim()) : [];
        
        console.log('🔍 Extracted C++ function:', functionName);
        console.log('🔍 Return type:', returnType);
        console.log('🔍 Parameters:', params);

        // Extract function body
        const bodyMatch = code.match(new RegExp(`${returnType}\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}(?=\\s*\\n\\s*\\n|\\s*$)`));
        const functionBody = bodyMatch ? bodyMatch[1] : '';

        return `#include <iostream>
using namespace std;

${returnType} ${functionName}(${params.join(', ')}) {
${functionBody}
}

int main() {
    ${params.map((param, i) => {
        const paramName = param.split(' ').pop() || `param${i}`;
        return `int ${paramName}; std::cin >> ${paramName};`;
    }).join('\n    ')}
    
    ${returnType} result = ${functionName}(${params.map((param, i) => param.split(' ').pop() || `param${i}`).join(', ')});
    std::cout << result << std::endl;
    return 0;
}`;
    }

    private generateJavaDriver(code: string): string {
        // Extract the Solution class and its method
        const classMatch = code.match(/public class Solution\s*\{[\s\S]*?\}/);
        
        if (!classMatch) {
            console.log('⚠️ Could not extract Java Solution class, using original code');
            return code;
        }

        // Extract the method signature and body
        const methodMatch = code.match(/public\s+(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{[\s\S]*?\}/);
        
        if (!methodMatch) {
            console.log('⚠️ Could not extract Java method, using original code');
            console.log('🔍 Code to parse:', code);
            return code;
        }

        const returnType = methodMatch[1];
        const methodName = methodMatch[2];
        const params = methodMatch[3] ? methodMatch[3].split(',').map(p => p.trim()) : [];
        
        if (!returnType || !methodName) {
            console.log('⚠️ Could not extract return type or method name, using original code');
            return code;
        }
        
        console.log('🔍 Extracted Java method:', methodName);
        console.log('🔍 Return type:', returnType);
        console.log('🔍 Parameters:', params);

        // Extract the entire method body - use a simpler approach
        const methodStart = code.indexOf(`public ${returnType} ${methodName}(`);
        if (methodStart === -1) {
            console.log('⚠️ Could not find method start, using original code');
            return code;
        }
        
        // Find the opening brace after the method signature
        const signatureEnd = code.indexOf('{', methodStart);
        if (signatureEnd === -1) {
            console.log('⚠️ Could not find method opening brace, using original code');
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

        console.log('🔍 Generated Java code:');
        console.log('```java');
        console.log(generatedCode);
        console.log('```');
        
        return generatedCode;
    }

    private async runTestCaseWithJudge0(submission: SubmissionMessage, testCase: any): Promise<ExecutionResult> {
        try {
            console.log('📝 Original Code Received:')
            console.log('```')
            console.log(submission.code)
            console.log('```')
            
            const languageId = this.judge0Service.getLanguageId(submission.lang)
            
            // Prepare input data from test case
            let stdin = ''
            
            console.log('🧪 Test Case Details:')
            console.log(`   Test Case: ${JSON.stringify(testCase, null, 2)}`)
            
            // Handle test case inputs based on the schema
            if (testCase.testCaseInputs && testCase.testCaseInputs.length > 0) {
                // Sort by position and extract values
                const sortedInputs = testCase.testCaseInputs.sort((a: any, b: any) => a.position - b.position);
                
                // Check if any parameter is an array
                const hasArrayParam = sortedInputs.some((input: any) => Array.isArray(input.value));
                
                if (hasArrayParam) {
                    // For array parameters, send JSON
                    stdin = JSON.stringify(sortedInputs[0].value);
                } else {
                    // For simple parameters, use space separator
                    const separator = ' ';
                    stdin = sortedInputs
                        .map((input: any) => {
                            // Handle different value types
                            if (typeof input.value === 'string') {
                                return input.value;
                            } else if (typeof input.value === 'number') {
                                return input.value.toString();
                            } else {
                                return JSON.stringify(input.value);
                            }
                        })
                        .join(separator);
                }
            } else if (testCase.inputs) {
                // Fallback to the inputs field if testCaseInputs is not available
                if (typeof testCase.inputs === 'string') {
                    stdin = testCase.inputs
                } else if (Array.isArray(testCase.inputs)) {
                    // Use space separator for both JavaScript and Python
                    const separator = ' '
                    stdin = testCase.inputs.join(separator)
                } else {
                    stdin = JSON.stringify(testCase.inputs)
                }
            }

            // Prepare expected output
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

            // Submit to Judge0
            console.log('🔍 Language detected:', submission.lang);
            console.log('🔍 Language lowercase:', submission.lang.toLowerCase());
            const modifiedCode = this.modifyCodeForTestCases(submission.code, submission.lang, testCase.testCaseInputs)
            
            console.log('🔧 Generated Code for Execution:')
            console.log('```')
            console.log(modifiedCode)
            console.log('```')
            
            const judge0Submission: Judge0Submission = {
                source_code: modifiedCode,
                language_id: languageId,
                stdin: stdin,
                expected_output: expectedOutput,
                cpu_time_limit: 5, // 5 seconds
                memory_limit: 512000 // 512MB
            }

            console.log('📤 Judge0 submission:', {
                languageId,
                stdin,
                expectedOutput,
                codeLength: modifiedCode.length
            })

            console.log('🔄 Submitting to Judge0...')
            let result: any
            try {
                const token = await this.judge0Service.submitCode(judge0Submission)
                console.log('✅ Judge0 submission successful, token:', token)
                
                // Wait for result
                console.log('⏳ Waiting for Judge0 result...')
                result = await this.judge0Service.waitForResult(token)
                console.log('✅ Judge0 result received')
            } catch (error) {
                console.error('❌ Judge0 error:', error)
                throw error
            }
            
            console.log('📥 Judge0 result:', {
                statusId: result.status.id,
                statusDescription: result.status.description,
                stdout: result.stdout,
                stderr: result.stderr,
                compileOutput: result.compile_output
            })

            // Add detailed comparison logging
            console.log('🔍 Result Analysis:')
            console.log(`   Expected Output: "${expectedOutput}"`)
            console.log(`   Actual Output: "${result.stdout}"`)
            console.log(`   Output Match: ${result.stdout?.trim() === expectedOutput}`)
            console.log(`   Status: ${result.status.description} (ID: ${result.status.id})`)
            
            if (result.stderr) {
                console.log(`   Error Output: ${result.stderr}`)
            }
            
            if (result.compile_output) {
                console.log(`   Compile Output: ${result.compile_output}`)
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
        } catch (error) {
            console.error('Failed to save submission to database:', error)
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
