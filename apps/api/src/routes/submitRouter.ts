import {Request, Response, Router} from 'express'
import { questionSubmission } from '../types/types'
import { RedisManager } from '@repo/redis/redis'

export const submitRouter = Router()

submitRouter.post('/run',async (req : Request, res : Response)=> {
    const data : questionSubmission = req.body
    if(!data) {
        res.status(400).json({
            msg : 'Body not found!'
        })
        return
    }

    const response = await RedisManager.getInstance().sendAndAwait(data)
    res.status(200).json(response.payload)
    

})

submitRouter.post('/submit',async (req : Request, res : Response)=> {
    const data : questionSubmission = req.body
    if(!data) {
        res.status(400).json({
            msg : 'Body not found!'
        })
        return
    }

    const response = await RedisManager.getInstance().sendAndAwait(data)
    res.status(200).json(response.payload)
})