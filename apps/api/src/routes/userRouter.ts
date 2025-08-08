import prisma from '@repo/db/client'
import { Request, Response, Router} from 'express'

export const userRouter = Router()

// Get solved problems for a user
userRouter.get('/solved-problems', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const solvedProblems = await prisma.submission.findMany({
            where: {
                userId: userId,
                status: 'AC' // AC = Accepted/Solved
            },
            select: {
                questionId: true
            },
            distinct: ['questionId']
        });

        const solvedProblemIds = solvedProblems.map(sub => sub.questionId);
        res.status(200).json(solvedProblemIds);
    } catch (error) {
        console.error('Error fetching solved problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// get all users (for testing)
userRouter.get('/all', async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true
        }
    })
    res.status(200).json(users)
})

// user crud operation to make their profile - done by using clerk

// get user profile
userRouter.get('/',async (req : Request, res : Response)=> {
    const {userId} = req.body

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })

    res.status(200).json(user)
})

// update user profile
userRouter.put('/',async (req : Request, res : Response)=> {
    const {userId, username, email} = req.body

    const user = await prisma.user.update({ 
        where: {
            id: userId
        },
        data: {
            username, email
        }
    })

    res.status(200).json(user)
})

// delete user profile
userRouter.delete('/',async (req : Request, res : Response)=> {
    const {userId} = req.body

    const user = await prisma.user.delete({
        where: {
            id: userId
        }
    })

    res.status(200).json(user)
})