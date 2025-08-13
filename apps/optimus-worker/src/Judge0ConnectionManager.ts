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

    private currentProvider: Judge0Provider = Judge0Provider.SELF_HOSTED
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
        // IDs aligned to official Judge0 CE v1.13.x (from /languages)
        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'js':
                return 63 // JavaScript (Node.js 12.14.0)
            case 'python':
            case 'py':
                return 71 // Python (3.8.1)
            case 'cpp':
            case 'c++':
                return 54 // C++ (GCC 9.2.0)
            case 'java':
                return 62 // Java (OpenJDK 13.0.1)
            case 'c':
                return 50 // C (GCC 9.2.0)
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
        const options = {
            method: 'POST',
            url: `${this.selfHostedConfig.baseUrl}/submissions`,
            headers: {
                'Content-Type': 'application/json',
                ...(this.selfHostedConfig.apiKey && { 'Authorization': `Bearer ${this.selfHostedConfig.apiKey}` })
            },
            data: submission
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
            url: `${this.selfHostedConfig.baseUrl}/submissions/${token}`,
            headers: {
                ...(this.selfHostedConfig.apiKey && { 'Authorization': `Bearer ${this.selfHostedConfig.apiKey}` })
            }
        }

        const response = await axios.request(options)
        return response.data
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