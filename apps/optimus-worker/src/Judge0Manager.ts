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

export class Judge0Service {
    private baseUrl: string
    private apiKey?: string
    private apiHost: string

    constructor() {
        this.baseUrl = process.env.JUDGE0_URL || ''
        this.apiKey = process.env.JUDGE0_API_KEY || ''
        this.apiHost = 'judge0-extra-ce.p.rapidapi.com'
    }

    public getLanguageId(lang: string): number {
        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'js':
                return 63 // JavaScript (Node.js 18.15.0)
            case 'python':
            case 'py':
                return 25 // Python for ML (3.11.2)
            case 'cpp':
            case 'c++':
                return 2 // C++ (Clang 10.0.1)
            case 'java':
                return 4 // Java (OpenJDK 14.0.1)
            case 'c':
                return 1 // C (Clang 10.0.1)
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
        const options = {
            method: 'POST',
            url: `${this.baseUrl}/submissions`,
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-key': this.apiKey,
                'x-rapidapi-host': this.apiHost
            },
            data: submission
        }

        try {
            console.log('🌐 Submitting to Judge0 API...')
            const response = await axios.request(options)
            console.log('✅ Judge0 API submission successful')
            return response.data.token
        } catch (error: any) {
            console.error('❌ Judge0 API submission failed:', error.response?.data || error.message)
            throw new Error(`Judge0 submission failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async getSubmissionResult(token: string): Promise<Judge0Response> {
        const options = {
            method: 'GET',
            url: `${this.baseUrl}/submissions/${token}`,
            headers: {
                'x-rapidapi-key': this.apiKey,
                'x-rapidapi-host': this.apiHost
            }
        }

        try {
            const response = await axios.request(options)
            return response.data
        } catch (error: any) {
            throw new Error(`Failed to get Judge0 result: ${error.response?.data?.message || error.message}`)
        }
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
}