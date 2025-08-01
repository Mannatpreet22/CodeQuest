import { createClient } from '@redis/client'

import { parsedQuestionSubmission } from '@repo/commons/types'
import prisma from '@repo/db/client'
import { Judge0Service, Status, Judge0Submission } from './Judge0Manager'

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
}

class OptimusWorker {
    private redisClient
    private redisPublisher
    private judge0Service: Judge0Service
    private isRunning = false
    private isConnected = false

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
        
        this.redisClient = createClient({
            url: redisUrl
        })
        this.redisPublisher = createClient({
            url: redisUrl
        })
        this.judge0Service = new Judge0Service()
        
        this.setupEventListeners()
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
            console.log('⚖️ Using Judge0 RapidAPI for code execution')
            
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
                status: result.status
            })

            console.log(`✅ Submission ${submission.submissionId} processed successfully`)
            
        } catch (error: any) {
            console.error(`❌ Error processing submission ${submission.submissionId}:`, error)
            
            // Send error result back
            await this.sendResult(submission.submissionId, {
                id: submission.submissionId,
                status: Status.RE
            })
        }
    }

    private async executeCodeWithJudge0(submission: SubmissionMessage, testCases: any[]): Promise<ExecutionResult> {
        try {
            // Execute against each test case
            for (const testCase of testCases) {
                const result = await this.runTestCaseWithJudge0(submission, testCase)
                
                if (!result.success) {
                    return {
                        success: false,
                        output: result.output,
                        status: Status.WA
                    }
                }
                
                // Check if output matches expected output
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
                
                if (result.output?.trim() !== expectedOutput.trim()) {
                    return {
                        success: false,
                        output: result.output,
                        status: Status.WA
                    }
                }
            }
            
            return {
                success: true,
                status: Status.AC
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
            if (testCaseInputs && testCaseInputs.length > 0) {
                // Find the function definition and extract it completely
                const functionMatch = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/);
                
                if (functionMatch) {
                    const functionOnly = functionMatch[0];
                    console.log('🔍 Extracted function:', functionOnly);
                    
                    // Extract function name from the function definition
                    const functionNameMatch = functionOnly.match(/function\s+(\w+)\s*\(/);
                    const functionName = functionNameMatch ? functionNameMatch[1] : 'addTwoNumbers';
                    
                    const stdinCode = `
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

${functionOnly}

rl.on('line', (input) => {
    const values = input.split(' ').map(Number);
    const result = ${functionName}(values[0], values[1]);
    console.log(result);
    rl.close();
});`
                    console.log('🔧 Modified JavaScript code:', stdinCode)
                    return stdinCode
                } else {
                    console.log('⚠️ Could not extract function, using original code')
                }
            }
        }
        return code
    }

    private async runTestCaseWithJudge0(submission: SubmissionMessage, testCase: any): Promise<ExecutionResult> {
        try {
            const languageId = this.judge0Service.getLanguageId(submission.lang)
            
            // Prepare input data from test case
            let stdin = ''
            
            // Handle test case inputs based on the schema
            if (testCase.testCaseInputs && testCase.testCaseInputs.length > 0) {
                // Sort by position and extract values
                // Use space separator for both JavaScript and Python since they both expect space-separated input
                const separator = ' '
                stdin = testCase.testCaseInputs
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((input: any) => {
                        // Handle different value types
                        if (typeof input.value === 'string') {
                            return input.value
                        } else if (typeof input.value === 'number') {
                            return input.value.toString()
                        } else if (Array.isArray(input.value)) {
                            return input.value.join(' ')
                        } else {
                            return JSON.stringify(input.value)
                        }
                    })
                    .join(separator)
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
            const modifiedCode = this.modifyCodeForTestCases(submission.code, submission.lang, testCase.testCaseInputs)
            
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
            const token = await this.judge0Service.submitCode(judge0Submission)
            console.log('✅ Judge0 submission successful, token:', token)
            
            // Wait for result
            console.log('⏳ Waiting for Judge0 result...')
            const result = await this.judge0Service.waitForResult(token)
            console.log('✅ Judge0 result received')
            
            console.log('📥 Judge0 result:', {
                statusId: result.status.id,
                statusDescription: result.status.description,
                stdout: result.stdout,
                stderr: result.stderr,
                compileOutput: result.compile_output
            })
            
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
