import {NextFunction, Request, Response, Router} from 'express'
import { questionSubmission } from '../types/types'
import { RedisManager } from '@repo/redis/redis'
import { parsedQuestionSubmission } from '@repo/commons/types'
import { rateLimit } from 'express-rate-limit'
export const submitRouter = Router()

// rate limit
const rateLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

submitRouter.use(rateLimiter)

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

submitRouter.post('/submit',async (req : Request, res : Response)=> {
    const data : questionSubmission = req.body
    const parseResult = parsedQuestionSubmission.safeParse(data)
    if(!parseResult.success) {
        res.status(400).json({
            msg : 'Body not found!'
        })
        return
    }
/*
    submissionId :string
    problemId : string
    userId : string
    code : string
    language : string
*/
    const response = await RedisManager.getInstance().sendAndAwait({
        userId: parseResult.data.userId,
        problemId: parseResult.data.problemId,
        lang: parseResult.data.lang,
        code: parseResult.data.code
    })
    if(response.payload) {
        res.status(200).json(response.payload)
    }
    else {
        res.status(500).json({
            msg : 'Submission failed!'
        })
    }
})