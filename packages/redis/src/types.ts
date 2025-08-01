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
        status : string
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