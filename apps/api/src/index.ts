import express, { Request, Response } from 'express'
import cors from 'cors'
import { userRouter } from './routes/userRouter'
import { questionsRouter } from './routes/questionsRouter'
import { submitRouter } from './routes/submitRouter'
import { webhookRouter } from './routes/webhookRouter'
import { RedisManager } from '@repo/redis/client'

const app = express()

const PORT = 3000

app.use(cors())

// Webhook routes need raw body, so handle them before express.json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter)

// Regular JSON parsing for other routes
app.use(express.json())

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
    try {
        // Check Redis connection
        const redisManager = await RedisManager.getInstance()
        const redisHealth = await redisManager.healthCheck()
        
        res.status(200).json({
            status: 'healthy',
            service: 'codequest-api',
            timestamp: new Date().toISOString(),
            redis: redisHealth ? 'connected' : 'disconnected',
            uptime: process.uptime()
        })
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            service: 'codequest-api',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// API routes
app.use('/api/user', userRouter)
app.use('/api/questions', questionsRouter)
app.use('/api/submit', submitRouter)

app.listen(PORT, () => {
    console.log(`🚀 CodeQuest API server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
})