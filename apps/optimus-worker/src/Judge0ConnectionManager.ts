import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

export enum Status {
    AC = 'AC',
    WA = 'WA',
    TLE = 'TLE',
    RE = 'RE',
    CE = 'CE'
}

export interface Judge0Submission {
    source_code: string
    language_id: number
    stdin?: string
    expected_output?: string
    cpu_time_limit?: number
    memory_limit?: number
}

interface Judge0Response {
    token: string
    status: {
        id: number
        description: string
    }
    stdout?: string
    stderr?: string
    compile_output?: string
    time?: string
    memory?: number
}

export enum Judge0Provider {
    RAPIDAPI = 'rapidapi',
    SELF_HOSTED = 'self_hosted'
}

export class Judge0ConnectionManager {
    private rapidApiConfig = {
        baseUrl: process.env.JUDGE0_RAPIDAPI_URL || '',
        apiKey: process.env.JUDGE0_API_KEY || '',
        apiHost: 'judge0-extra-ce.p.rapidapi.com'
    }

    private selfHostedConfig = {
        baseUrl: process.env.JUDGE0_SELF_HOSTED_URL || 'http://judge0:2358',
        apiKey: process.env.JUDGE0_SELF_HOSTED_KEY || ''
    }

    private currentProvider: Judge0Provider = Judge0Provider.RAPIDAPI
    private isRapidApiQuotaExceeded = false

    constructor() {
        console.log('🔧 Judge0 Connection Manager initialized')
        console.log(`📡 Primary provider: ${this.currentProvider}`)
        console.log(`🔄 Fallback provider: ${Judge0Provider.SELF_HOSTED}`)
        console.log(`🔄 RapidAPI base URL: ${this.rapidApiConfig.baseUrl}`)
        console.log(`🔄 RapidAPI API Key: ${this.rapidApiConfig.apiKey ? '***' + this.rapidApiConfig.apiKey.slice(-4) : 'Not set'}`)
        console.log(`🔄 Self-hosted base URL: ${this.selfHostedConfig.baseUrl}`)
        console.log(`🔄 Self-hosted API Key: ${this.selfHostedConfig.apiKey ? '***' + this.selfHostedConfig.apiKey.slice(-4) : 'Not set'}`)
    }

    public getLanguageId(lang: string): number {
        // Language IDs for Judge0 Extra CE (Community Edition)
        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'js':
                return 63 // JavaScript (Node.js 18.15.0) - Judge0 Extra CE
            case 'python':
            case 'py':
                return 71 // Python (3.11.4) - Judge0 Extra CE
            case 'cpp':
            case 'c++':
                return 54 // C++ (GCC 11.2.0) - Judge0 Extra CE
            case 'c':
                return 50 // C (GCC 11.2.0) - Judge0 Extra CE
            default:
                throw new Error(`Unsupported language: ${lang}`)
        }
    }

    public getStatusFromJudge0(statusId: number): Status {
        switch (statusId) {
            case 3: // Accepted
                return Status.AC
            case 4: // Wrong Answer
                return Status.WA
            case 5: // Time Limit Exceeded
                return Status.TLE
            case 6: // Compilation Error
                return Status.CE
            default:
                return Status.RE
        }
    }

    async submitCode(submission: Judge0Submission): Promise<string> {
        try {
            if (this.currentProvider === Judge0Provider.RAPIDAPI && !this.isRapidApiQuotaExceeded) {
                return await this.submitToRapidAPI(submission)
            } else {
                return await this.submitToSelfHosted(submission)
            }
        } catch (error: any) {
            // If RapidAPI fails due to quota, switch to self-hosted
            if (this.currentProvider === Judge0Provider.RAPIDAPI && 
                error.response?.data?.message?.includes('quota')) {
                console.log('⚠️ RapidAPI quota exceeded, switching to self-hosted Judge0')
                this.isRapidApiQuotaExceeded = true
                this.currentProvider = Judge0Provider.SELF_HOSTED
                return await this.submitToSelfHosted(submission)
            }
            throw error
        }
    }

    async getSubmissionResult(token: string): Promise<Judge0Response> {
        if (this.currentProvider === Judge0Provider.RAPIDAPI && !this.isRapidApiQuotaExceeded) {
            return await this.getResultFromRapidAPI(token)
        } else {
            return await this.getResultFromSelfHosted(token)
        }
    }

    private async submitToRapidAPI(submission: Judge0Submission): Promise<string> {
        const options = {
            method: 'POST',
            url: `${this.rapidApiConfig.baseUrl}/submissions`,
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-key': this.rapidApiConfig.apiKey,
                'x-rapidapi-host': this.rapidApiConfig.apiHost
            },
            data: submission
        }

        console.log('🌐 Submitting to Judge0 RapidAPI...')
        const response = await axios.request(options)
        console.log('✅ Judge0 RapidAPI submission successful')
        return response.data.token
    }

    private async submitToSelfHosted(submission: Judge0Submission): Promise<string> {
        // For self-hosted Judge0, encode the source code in base64 to avoid UTF-8 issues
        const encodedSubmission = {
            ...submission,
            source_code: Buffer.from(submission.source_code, 'utf-8').toString('base64'),
            stdin: submission.stdin ? Buffer.from(submission.stdin, 'utf-8').toString('base64') : undefined
        }
        
        const options = {
            method: 'POST',
            url: `${this.selfHostedConfig.baseUrl}/submissions?base64_encoded=true`,
            headers: {
                'Content-Type': 'application/json',
                ...(this.selfHostedConfig.apiKey && { 'Authorization': `Bearer ${this.selfHostedConfig.apiKey}` })
            },
            data: encodedSubmission
        }

        console.log('🌐 Submitting to self-hosted Judge0...')
        const response = await axios.request(options)
        console.log('✅ Self-hosted Judge0 submission successful')
        return response.data.token
    }

    private async getResultFromRapidAPI(token: string): Promise<Judge0Response> {
        const options = {
            method: 'GET',
            url: `${this.rapidApiConfig.baseUrl}/submissions/${token}`,
            headers: {
                'x-rapidapi-key': this.rapidApiConfig.apiKey,
                'x-rapidapi-host': this.rapidApiConfig.apiHost
            }
        }

        const response = await axios.request(options)
        return response.data
    }

    private async getResultFromSelfHosted(token: string): Promise<Judge0Response> {
        const options = {
            method: 'GET',
            url: `${this.selfHostedConfig.baseUrl}/submissions/${token}?base64_encoded=true`,
            headers: {
                ...(this.selfHostedConfig.apiKey && { 'Authorization': `Bearer ${this.selfHostedConfig.apiKey}` })
            }
        }

        const response = await axios.request(options)
        
        // Decode base64 encoded fields if they exist
        const data = response.data
        if (data.stdout && typeof data.stdout === 'string') {
            try {
                data.stdout = Buffer.from(data.stdout, 'base64').toString('utf-8')
            } catch (e) {
                console.log('⚠️ Could not decode stdout from base64, using as-is')
            }
        }
        if (data.stderr && typeof data.stderr === 'string') {
            try {
                data.stderr = Buffer.from(data.stderr, 'base64').toString('utf-8')
            } catch (e) {
                console.log('⚠️ Could not decode stderr from base64, using as-is')
            }
        }
        if (data.compile_output && typeof data.compile_output === 'string') {
            try {
                data.compile_output = Buffer.from(data.compile_output, 'base64').toString('utf-8')
            } catch (e) {
                console.log('⚠️ Could not decode compile_output from base64, using as-is')
            }
        }
        
        return data
    }

    async waitForResult(token: string, maxWaitTime: number = 30000): Promise<Judge0Response> {
        const startTime = Date.now()
        const pollInterval = 1000 // 1 second
        let pollCount = 0

        console.log('⏳ Starting to poll for Judge0 result...')
        
        while (Date.now() - startTime < maxWaitTime) {
            pollCount++
            console.log(`🔄 Polling attempt ${pollCount}...`)
            
            const result = await this.getSubmissionResult(token)
            console.log(`📊 Poll result - Status ID: ${result.status.id}, Description: ${result.status.description}`)
            
            // Check if processing is complete
            if (result.status.id >= 3) { // 3 = Accepted, 4 = Wrong Answer, etc.
                console.log('✅ Judge0 processing complete')
                return result
            }

            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, pollInterval))
        }

        console.error('⏰ Judge0 submission timed out')
        throw new Error('Judge0 submission timed out')
    }

    // Method to manually switch providers (useful for testing)
    public switchProvider(provider: Judge0Provider): void {
        this.currentProvider = provider
        console.log(`🔄 Switched to provider: ${provider}`)
    }

    // Method to get current provider status
    public getCurrentProvider(): Judge0Provider {
        return this.currentProvider
    }

    // Method to check if RapidAPI quota is exceeded
    public getRapidApiQuotaExceeded(): boolean {
        return this.isRapidApiQuotaExceeded
    }
} 