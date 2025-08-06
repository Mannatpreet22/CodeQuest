import {Router, RequestHandler} from 'express'
import prisma from '@repo/db/client'
export const questionsRouter = Router()

const getAllQuestions: RequestHandler = async (req, res) => {
    const questions = await prisma.question.findMany({})
    if (!questions) {
        res.status(404).json({error : 'No questions found'})
        return
    }
    res.json(questions)
}

questionsRouter.get('/all-questions', getAllQuestions)

questionsRouter.get('/question', async (req, res) => {
    const {id} = req.query
    if (!id) {
        res.status(400).json({error : 'No id provided'})
        return
    }
    const question = await prisma.question.findUnique({where : {id : id as string}})
    if (!question || question.id !== id) {
        res.status(404).json({error : 'Question not found'})
        return
    }
    res.json(question)
})

// Get question with visible test cases only (for users)
questionsRouter.get('/question/:id/testcases', async (req, res) => {
    const {id} = req.params
    if (!id) {
        res.status(400).json({error : 'No id provided'})
        return
    }
    const question = await prisma.question.findUnique({
        where: {id: id as string},
        include: {
            testcases: {
                where: {
                    isVisible: true  // Only return visible test cases
                },
                include: {
                    testCaseInputs: true
                }
            }
        }
    })
    if (!question) {
        res.status(404).json({error : 'Question not found'})
        return
    }
    res.json(question)
})

// Get question with ALL test cases (for submission/evaluation)
questionsRouter.get('/question/:id/all-testcases', async (req, res) => {
    const {id} = req.params
    if (!id) {
        res.status(400).json({error : 'No id provided'})
        return
    }
    const question = await prisma.question.findUnique({
        where: {id: id as string},
        include: {
            testcases: {
                include: {
                    testCaseInputs: true
                }
            }
        }
    })
    if (!question) {
        res.status(404).json({error : 'Question not found'})
        return
    }
    res.json(question)
})

