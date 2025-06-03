import {z} from 'zod'

export const parsedQuestionSubmission = z.object({
    problemId : z.string(),
    userId : z.string(),
    code : z.string(),
    lang : z.string(),
})