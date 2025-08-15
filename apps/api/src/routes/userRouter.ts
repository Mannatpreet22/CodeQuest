import prisma from '@repo/db/client'
import { Request, Response, Router} from 'express'

export const userRouter = Router()

const validateUserId = (req: Request, res: Response, next: Function) => {
    const userId = req.query.userId || req.body.userId;
    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    // In production, you should verify this userId matches the authenticated user
    // For now, we'll add basic validation
    if (userId.length < 3 || userId.length > 100) {
        return res.status(400).json({ error: 'Invalid userId format' });
    }
    
    next();
};

// Get solved problems for a user
userRouter.get('/solved-problems', validateUserId, async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;

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

        const solvedProblemIds = solvedProblems.map((sub: any) => sub.questionId);
        res.status(200).json(solvedProblemIds);
    } catch (error) {
        console.error('Error fetching solved problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get user profile
userRouter.get('/', validateUserId, async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Update user profile
userRouter.put('/', validateUserId, async (req: Request, res: Response) => {
    try {
        const { userId, username, email } = req.body;

        // Validate input data
        if (username && (typeof username !== 'string' || username.length > 50)) {
            return res.status(400).json({ error: 'Invalid username format' });
        }

        if (email && (typeof email !== 'string' || !email.includes('@'))) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const user = await prisma.user.update({ 
            where: {
                id: userId
            },
            data: {
                username: username || undefined,
                email: email || undefined
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                updatedAt: true
            }
        });

        res.status(200).json(user);
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
})

// Delete user profile
userRouter.delete('/', validateUserId, async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        const user = await prisma.user.delete({
            where: {
                id: userId
            }
        });

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user profile:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
})