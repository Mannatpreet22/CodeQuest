// submissionId :string
//     problemId : string
//     userId : string
//     code : string
//     language : string
export type IncomingMessage = {
    userId: string,
    problemId : string,
    code: string,
    lang: string
}

export type ResponseData = {
    payload : {
        id : string,
        status : string,
        testResults?: Array<{
            testCaseId: number
            isVisible: boolean
            status: string
            output?: string
            error?: string
            runtime?: number
            memory?: number
            expected?: string
            actual?: string
        }>
    }
}

export enum Status {
    'AC',     // Accepted
    'WA',     // Wrong Answer
    'TLE',   // Time Limit Exceeded
    'RE',     // Runtime Error
    'CE',     // Compilation Error
    'Pending'
}