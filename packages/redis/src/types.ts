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
        status : Status
    }
}

enum Status {
    'Success',
    'Failure',
    'Pending'
}