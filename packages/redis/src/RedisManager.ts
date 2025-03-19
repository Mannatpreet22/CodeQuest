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
            const id: string = this.generateUniqueId()
            this.client.subscribe(id, (message: any) => {
                this.client.unsubscribe(id)
                res(JSON.parse(message))
            })

            this.publisher.lPush('messages', JSON.stringify({ clientId: id, message }))
        })
    }

    private generateUniqueId = (size = 21) => {
        return crypto.randomBytes(size).toString('base64').slice(0, size)
    }
}