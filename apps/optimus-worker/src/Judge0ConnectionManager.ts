import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Judge0 Connection Manager
 * 
 * Configuration:
 * - JUDGE0_SELF_HOSTED_URL: Your self-hosted Judge0 server URL (e.g., http://your-server:2358)
 * - JUDGE0_SELF_HOSTED_KEY: Your self-hosted Judge0 API key (if required)
 * - JUDGE0_RAPIDAPI_URL: RapidAPI Judge0 URL (fallback only)
 * - JUDGE0_API_KEY: RapidAPI key (fallback only)
 * 
 * This manager prioritizes self-hosted Judge0 and only falls back to RapidAPI if self-hosted fails.
 */

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
        baseUrl: process.env.JUDGE0_SELF_HOSTED_URL || 'http://localhost:2358',
        apiKey: process.env.JUDGE0_SELF_HOSTED_KEY || ''
    }

    private currentProvider: Judge0Provider = Judge0Provider.SELF_HOSTED
    private isRapidApiQuotaExceeded = true

    constructor() {
        // Always use self-hosted Judge0 as primary, RapidAPI as fallback
        this.currentProvider = Judge0Provider.SELF_HOSTED
        this.isRapidApiQuotaExceeded = true
        
        console.log('🔧 Judge0 Connection Manager initialized')
        console.log(`📡 Primary provider: ${this.currentProvider}`)
        console.log(`🔄 Fallback provider: ${Judge0Provider.RAPIDAPI}`)
        console.log(`🔄 RapidAPI base URL: ${this.rapidApiConfig.baseUrl}`)
        console.log(`🔄 RapidAPI API Key: ${this.rapidApiConfig.apiKey ? '***' + this.rapidApiConfig.apiKey.slice(-4) : 'Not set'}`)
        console.log(`🔄 Self-hosted base URL: ${this.selfHostedConfig.baseUrl}`)
        console.log(`🔄 Self-hosted API Key: ${this.selfHostedConfig.apiKey ? '***' + this.selfHostedConfig.apiKey.slice(-4) : 'Not set'}`)
    }

    public getLanguageId(lang: string): number {
        // Standard Judge0 language IDs
        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'js':
                return 63 // JavaScript (Node.js)
            case 'python':
            case 'py':
                return 71 // Python
            case 'cpp':
            case 'c++':
                return 54 // C++
            default:
                throw new Error(`Unsupported language: ${lang}`)
        }
    }

    /**
     * Fetch available languages from self-hosted Judge0 instance
     * This helps verify the correct language IDs for your specific setup
     */
    public async getAvailableLanguages(): Promise<any[]> {
        try {
            const response = await axios.get(`${this.selfHostedConfig.baseUrl}/languages`, {
                headers: this.selfHostedConfig.apiKey ? {
                    'Authorization': `Bearer ${this.selfHostedConfig.apiKey}`
                } : {}
            });
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch languages from self-hosted Judge0:', error);
            return [];
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
            // Always try self-hosted first, fallback to RapidAPI only if self-hosted fails
            return await this.submitToSelfHosted(submission)
        } catch (error: any) {
            console.log('⚠️ Self-hosted Judge0 failed, trying RapidAPI as fallback...')
            try {
                return await this.submitToRapidAPI(submission)
            } catch (rapidApiError: any) {
                console.error('❌ Both self-hosted and RapidAPI failed')
                throw error // Throw the original self-hosted error
            }
        }
    }

    async getSubmissionResult(token: string): Promise<Judge0Response> {
        // Always try self-hosted first, fallback to RapidAPI only if self-hosted fails
        try {
            return await this.getResultFromSelfHosted(token)
        } catch (error: any) {
            console.log('⚠️ Self-hosted Judge0 failed, trying RapidAPI as fallback...')
            try {
                return await this.getResultFromRapidAPI(token)
            } catch (rapidApiError: any) {
                console.error('❌ Both self-hosted and RapidAPI failed')
                throw error // Throw the original self-hosted error
            }
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
        if (provider === Judge0Provider.SELF_HOSTED) {
            this.isRapidApiQuotaExceeded = true
        }
        console.log(`🔄 Switched to provider: ${provider}`)
    }

    // Method to force self-hosted Judge0 (useful for production)
    public forceSelfHosted(): void {
        this.currentProvider = Judge0Provider.SELF_HOSTED
        this.isRapidApiQuotaExceeded = true
        console.log('🔒 Forced to use self-hosted Judge0')
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