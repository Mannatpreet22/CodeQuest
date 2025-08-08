import {RedisClientType, createClient} from '@redis/client'
import crypto from 'crypto'
import { IncomingMessage, ResponseData } from './types'
import dotenv from 'dotenv'

dotenv.config()

export class RedisManager {
    private client: RedisClientType
    private publisher: RedisClientType
    private static instance: RedisManager
    private readonly TIMEOUT_MS = 30000 // 30 seconds timeout
    private isConnected = false

    private constructor() {
        // Local Redis configuration for testing
        const redisConfig = {
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379')
            }
        }

        this.client = createClient(redisConfig)
        this.publisher = createClient(redisConfig)
        
        // Add event listeners for connection monitoring
        this.setupEventListeners()
    }

    private setupEventListeners() {
        this.client.on('connect', () => {
            console.log('✅ Redis client connected to Redis Cloud')
            this.isConnected = true
        })

        this.client.on('ready', () => {
            console.log('✅ Redis client ready')
        })

        this.client.on('error', (err) => {
            console.error('❌ Redis client error:', err)
            this.isConnected = false
        })

        this.client.on('end', () => {
            console.log('🔌 Redis client disconnected')
            this.isConnected = false
        })

        this.publisher.on('connect', () => {
            console.log('✅ Redis publisher connected to Redis Cloud')
        })

        this.publisher.on('error', (err) => {
            console.error('❌ Redis publisher error:', err)
        })
    }

    public static async getInstance(): Promise<RedisManager> {
        if (!this.instance) {
            this.instance = new RedisManager()
            await this.instance.connect()
        }
        return this.instance
    }

    async connect() {
        if (this.isConnected) {
            console.log('Redis already connected')
            return
        }

        try {
            console.log('🔗 Connecting to Redis...')
            console.log(`Host: ${process.env.REDIS_HOST || 'localhost'}`)
            console.log(`Port: ${process.env.REDIS_PORT || '6379'}`)
            
            await this.client.connect()
            await this.publisher.connect()
            this.isConnected = true
            console.log('✅ Successfully connected to Redis')
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error)
            throw error
        }
    }

    async disconnect() {
        try {
            await this.client.disconnect()
            await this.publisher.disconnect()
            this.isConnected = false
            console.log('🔌 Disconnected from Redis Cloud')
        } catch (error) {
            console.error('Failed to disconnect from Redis:', error)
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            if (!this.isConnected) {
                return false
            }
            await this.client.ping()
            return true
        } catch (error) {
            console.error('Redis health check failed:', error)
            return false
        }
    }

    sendAndAwait(message: IncomingMessage): Promise<ResponseData> {
        return new Promise<ResponseData>(async (res, rej) => {
            if (!this.isConnected) {
                rej(new Error('Redis not connected'))
                return
            }

            const submissionId: string = this.generateUniqueId()
            let timeoutId: NodeJS.Timeout | undefined = undefined

            try {
                // Set timeout
                timeoutId = setTimeout(() => {
                    this.client.unsubscribe(submissionId).catch(() => {})
                    rej(new Error('Request timeout: Worker did not respond within 30 seconds'))
                }, this.TIMEOUT_MS)

                // Subscribe to response channel
                await this.client.subscribe(submissionId, (responseMessage: any) => {
                    if (timeoutId) clearTimeout(timeoutId)
                    this.client.unsubscribe(submissionId).catch(() => {})
                    
                    try {
                        const parsedMessage = JSON.parse(responseMessage)
                        res({
                            payload: {
                                id: submissionId,
                                status: parsedMessage.status || 'Pending',
                                testResults: parsedMessage.testResults || []
                            }
                        })
                    } catch (parseError) {
                        rej(new Error('Invalid response format from worker'))
                    }
                })

                // Send message to queue
                await this.publisher.lPush('messages', JSON.stringify({ 
                    ...message, 
                    submissionId 
                }))

            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId)
                this.client.unsubscribe(submissionId).catch(() => {})
                rej(error)
            }
        })
    }

    private generateUniqueId = (size = 21) => {
        return crypto.randomBytes(size).toString('base64').slice(0, size)
    }
}