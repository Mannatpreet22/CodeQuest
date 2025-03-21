export type IncomingMessage = {
    id: number,
    userId: string,
    problemId : string,
    code: string,
    language: string
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