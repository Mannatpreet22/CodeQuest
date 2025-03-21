import {Request, Response, Router} from 'express'
import { questionSubmission } from '../types/types'
import { RedisManager } from '@repo/redis/redis'
import { parsedQuestionSubmission } from '@repo/commons/types'

export const submitRouter = Router()

// submitRouter.post('/run',async (req : Request, res : Response)=> {
//     const data : questionSubmission = req.body
//     if(!data) {
//         res.status(400).json({
//             msg : 'Body not found!'
//         })
//         return
//     }

//     const response = await RedisManager.getInstance().sendAndAwait(data)
//     res.status(200).json(response.payload)
    

// })
/*
    /submit:
    submiision_id
    user_id
    code
    lang
*/
submitRouter.post('/submit',async (req : Request, res : Response)=> {
    const data : questionSubmission = req.body
    const parseResult = parsedQuestionSubmission.safeParse(data)
    if(!parseResult.success) {
        res.status(400).json({
            msg : 'Body not found!'
        })
        return
    }

    const response = await RedisManager.getInstance().sendAndAwait({
        userId: parseResult.data.user_id.toString(),
        problemId: parseResult.data.submission_id.toString(),
        language: parseResult.data.lang,
        code: parseResult.data.code
    })
    res.status(200).json(response.payload)
})