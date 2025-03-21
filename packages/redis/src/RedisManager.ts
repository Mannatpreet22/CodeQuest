import {RedisClientType, createClient} from '@redis/client'
import crypto from 'crypto'
import { IncomingMessage, ResponseData } from './types'

export class RedisManager {
    private client: RedisClientType
    private publisher: RedisClientType
    private static instance: RedisManager

    private constructor() {
        this.client = createClient()
        this.client.connect()
        this.publisher = createClient()
        this.publisher.connect()
    }

    public static getInstance(): RedisManager {
        if (!this.instance) {
            this.instance = new RedisManager()
        }
        return this.getInstance()
    }

    sendAndAwait(message: IncomingMessage) {
        return new Promise<ResponseData>((res, rej) => {
            const submissionId: string = this.generateUniqueId()
            this.client.subscribe(submissionId, (message: any) => {
                this.client.unsubscribe(submissionId)
                res(JSON.parse(message))
            })

            this.publisher.lPush('messages', JSON.stringify({ ...message, submissionId }))
        })
    }

    private generateUniqueId = (size = 21) => {
        return crypto.randomBytes(size).toString('base64').slice(0, size)
    }
}