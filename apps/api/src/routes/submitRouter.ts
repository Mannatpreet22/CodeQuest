import { NextFunction, Request, Response, Router } from 'express'
import { questionSubmission } from '../types/types'
import { RedisManager } from '@repo/redis/client'
import { parsedQuestionSubmission } from '@repo/commons/types'
import { rateLimit } from 'express-rate-limit'
import prisma from '@repo/db/client'

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

// Test code execution (doesn't save to database)
submitRouter.post('/run', async (req: Request, res: Response) => {
    const {userId} = req.body
    if (!userId) {
        res.status(401).json({success: false, message: 'User ID is required'})
        return
    }
    
    const user = await prisma.user.findUnique({
        where: {id: userId}
    })
    if (!user) {
        res.status(401).json({success: false, message: 'Unauthorized - User not found'})
        return
    }
    
    const data: questionSubmission = {
        ...req.body,
        userId: userId
    };
    const parseResult = parsedQuestionSubmission.safeParse(data)
    
    if (!parseResult.success) {
        res.status(400).json({
            success: false,
            message: 'Invalid request body!',
            errors: parseResult.error.errors
        })
        return
    }

    try {
        console.log(`🚀 Processing test run for user: ${parseResult.data.userId}, problem: ${parseResult.data.problemId}`)
        
        const redisManager = await RedisManager.getInstance()
        const response = await redisManager.sendAndAwait({
            userId: parseResult.data.userId,
            problemId: parseResult.data.problemId,
            lang: parseResult.data.lang,
            code: parseResult.data.code,
        })
        
        if (response.payload) {
            // Check if the status indicates success (AC = Accepted)
            const status = String(response.payload.status)
            const isSuccess = status === 'AC' || status === '3'
            
            // Get user-friendly status message
            let statusMessage = 'Code execution completed';
            if (status === 'AC') {
                statusMessage = 'Code executed successfully';
            } else if (status === 'WA') {
                statusMessage = 'Wrong Answer - Your output doesn\'t match the expected result';
            } else if (status === 'TLE') {
                statusMessage = 'Time Limit Exceeded - Your code took too long to execute';
            } else if (status === 'CE') {
                statusMessage = 'Compilation Error - Your code has syntax errors';
            } else if (status === 'RE') {
                statusMessage = 'Runtime Error - Your code crashed during execution';
            }
            
            res.status(200).json({
                success: isSuccess,
                data: response.payload,
                message: statusMessage
            })
        } else {
            res.status(500).json({
                success: false,
                message: 'Code execution failed!'
            })
        }
    } catch (error: any) {
        console.error('❌ Error in /run endpoint:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

submitRouter.post('/submit', async (req: Request, res: Response) => {
    const {userId} = req.body
    if (!userId) {
        res.status(401).json({success: false, message: 'User ID is required'})
        return
    }
    
    const user = await prisma.user.findUnique({
        where: {id: userId}
    })
    if (!user) {
        res.status(401).json({success: false, message: 'Unauthorized - User not found'})
        return
    }
    
    const data: questionSubmission = {
        ...req.body,
        userId: userId
    };
    const parseResult = parsedQuestionSubmission.safeParse(data)
    
    if (!parseResult.success) {
        res.status(400).json({
            success: false,
            message: 'Invalid request body!',
            errors: parseResult.error.errors
        })
        return
    }

    try {
        // Check for pending submission
        const userSubmission = await prisma.submission.findFirst({
            where: {
                userId: parseResult.data.userId,
                questionId: parseResult.data.problemId,
                status: 'PENDING'
            }
        })
        
        if (userSubmission) {
            res.status(400).json({
                success: false,
                message: 'You have already submitted this question and it is being processed!'
            })
            return
        }

        console.log(`📝 Processing submission for user: ${parseResult.data.userId}, problem: ${parseResult.data.problemId}`)
        
        // Send to worker via Redis
        const redisManager = await RedisManager.getInstance()
        const response = await redisManager.sendAndAwait({
            userId: parseResult.data.userId,
            problemId: parseResult.data.problemId,
            lang: parseResult.data.lang,
            code: parseResult.data.code,
        })
        
        if (response.payload) {
            // Check if the status indicates success (AC = Accepted)
            const status = String(response.payload.status)
            const isSuccess = status === 'AC' || status === '3'
            
            // Get user-friendly status message
            let statusMessage = 'Submission completed';
            if (status === 'AC') {
                statusMessage = 'Submission successful - All test cases passed!';
            } else if (status === 'WA') {
                statusMessage = 'Wrong Answer - Your output doesn\'t match the expected result';
            } else if (status === 'TLE') {
                statusMessage = 'Time Limit Exceeded - Your code took too long to execute';
            } else if (status === 'CE') {
                statusMessage = 'Compilation Error - Your code has syntax errors';
            } else if (status === 'RE') {
                statusMessage = 'Runtime Error - Your code crashed during execution';
            }
            
            res.status(200).json({
                success: isSuccess,
                data: response.payload,
                message: statusMessage
            })
        } else {
            res.status(500).json({
                success: false,
                message: 'Submission failed!'
            })
        }
    } catch (error: any) {
        console.error('❌ Error in /submit endpoint:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

// Get submission status
submitRouter.get('/submission/:submissionId', async (req: Request, res: Response) => {
    try {
        const { submissionId } = req.params
        
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                question: {
                    select: {
                        title: true
                    }
                }
            }
        })
        
        if (!submission) {
            res.status(404).json({
                success: false,
                message: 'Submission not found!'
            })
            return
        }
        
        res.status(200).json({
            success: true,
            data: submission
        })
    } catch (error: any) {
        console.error('❌ Error fetching submission:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

// Get all submissions for a user
submitRouter.get('/submissions/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params
        
        const submissions = await prisma.submission.findMany({
            where: { userId },
            include: {
                question: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        res.status(200).json({
            success: true,
            data: submissions
        })
    } catch (error: any) {
        console.error('❌ Error fetching user submissions:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

// Get submissions for a specific problem by a user
submitRouter.get('/submissions/:userId/:problemId', async (req: Request, res: Response) => {
    try {
        const { userId, problemId } = req.params
        
        const submissions = await prisma.submission.findMany({
            where: { 
                userId,
                questionId: problemId
            },
            include: {
                question: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        res.status(200).json({
            success: true,
            data: submissions
        })
    } catch (error: any) {
        console.error('❌ Error fetching user problem submissions:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

// Get all submissions (admin endpoint)
submitRouter.get('/all-submissions', async (req: Request, res: Response) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                question: {
                    select: {
                        title: true
                    }
                },
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        
        res.status(200).json({
            success: true,
            data: submissions
        })
    } catch (error: any) {
        console.error('❌ Error fetching all submissions:', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})