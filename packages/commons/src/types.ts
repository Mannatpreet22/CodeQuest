import {z} from 'zod'
// /submit:
// submiision_id
// user_id
// code
// lang

export const parsedQuestionSubmission = z.object({
    user_id: z.number(),
    code: z.string(),
    lang: z.string(),
})