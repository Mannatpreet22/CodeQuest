import prisma from '@repo/db/client'
import { Request, Response, Router} from 'express'

export const userRouter = Router()

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
    const {userId, username, email, passwordHash} = req.body

    const user = await prisma.user.update({ 
        where: {
            id: userId
        },
        data: {
            username, email, passwordHash
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