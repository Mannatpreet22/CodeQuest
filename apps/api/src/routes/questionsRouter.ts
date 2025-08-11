import {Router, RequestHandler, Request, Response} from 'express'
import prisma from '@repo/db/client'

export const questionsRouter = Router()

// Middleware to check if user is authenticated (basic check)
const requireAuth = (req: Request, res: Response, next: Function) => {
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
    
    if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Basic validation
    if (userId.length < 3 || userId.length > 100) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    next();
};

const getAllQuestions: RequestHandler = async (req, res) => {
    try {
        const questions = await prisma.question.findMany({
            select: {
                id: true,
                title: true,
                body: true,
                difficulty: true,
                createdAt: true,
                updatedAt: true
            }
        });
        
        if (!questions || questions.length === 0) {
            res.status(404).json({error : 'No questions found'})
            return
        }
        res.json(questions)
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

questionsRouter.get('/all-questions', getAllQuestions)

questionsRouter.get('/question', async (req, res) => {
    try {
        const {id} = req.query
        if (!id) {
            res.status(400).json({error : 'No id provided'})
            return
        }
        const question = await prisma.question.findUnique({
            where: {id: id as string},
            include: {
                examples: true  // Include examples
            }
        })
        if (!question || question.id !== id) {
            res.status(404).json({error : 'Question not found'})
            return
        }
        res.json(question)
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get question with visible test cases only (for users)
questionsRouter.get('/question/:id/testcases', async (req, res) => {
    try {
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
                },
                examples: true  // Include examples
            }
        })
        if (!question) {
            res.status(404).json({error : 'Question not found'})
            return
        }
        res.json(question)
    } catch (error) {
        console.error('Error fetching question test cases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get question with ALL test cases (for submission/evaluation - requires authentication)
questionsRouter.get('/question/:id/all-testcases', requireAuth, async (req, res) => {
    try {
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
                },
                examples: true  // Include examples
            }
        })
        if (!question) {
            res.status(404).json({error : 'Question not found'})
            return
        }
        res.json(question)
    } catch (error) {
        console.error('Error fetching question with all test cases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get template code for a specific problem and language
questionsRouter.get('/template/:id/:language', async (req, res) => {
    try {
        const {id, language} = req.params
        if (!id || !language) {
            res.status(400).json({error : 'No id or language provided'})
            return
        }
        
        const templateCode = await prisma.templateCode.findFirst({
            where: {
                questionId: id as string,
                programmingLanguageId: language as string
            }
        })
        
        if (!templateCode) {
            res.status(404).json({error : 'Template code not found'})
            return
        }
        
        res.json(templateCode)
    } catch (error) {
        console.error('Error fetching template code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get user interaction for a specific question
questionsRouter.get('/question/:id/interaction', async (req, res) => {
    const {id} = req.params
    const {userId} = req.query
    
    if (!id || !userId) {
        res.status(400).json({error : 'No id or userId provided'})
        return
    }
    
    try {
        const interaction = await prisma.userInteraction.findUnique({
            where: {
                userId_questionId: {
                    userId: userId as string,
                    questionId: id as string
                }
            }
        })
        
        res.json(interaction || { liked: false, disliked: false, starred: false })
    } catch (error) {
        console.error('Error fetching user interaction:', error);
        res.status(500).json({error : 'Failed to get user interaction'})
    }
})

// Get aggregated stats for a question (likes, dislikes, stars)
questionsRouter.get('/question/:id/stats', async (req, res) => {
    const {id} = req.params
    
    if (!id) {
        res.status(400).json({error : 'No id provided'})
        return
    }
    
    try {
        const [likes, dislikes, stars] = await Promise.all([
            prisma.userInteraction.count({
                where: {
                    questionId: id as string,
                    liked: true
                }
            }),
            prisma.userInteraction.count({
                where: {
                    questionId: id as string,
                    disliked: true
                }
            }),
            prisma.userInteraction.count({
                where: {
                    questionId: id as string,
                    starred: true
                }
            })
        ])
        
        res.json({ likes, dislikes, stars })
    } catch (error) {
        console.error('Error fetching question stats:', error);
        res.status(500).json({error : 'Failed to get question stats'})
    }
})

// Toggle like for a question
questionsRouter.post('/question/:id/like', async (req, res) => {
    const {id} = req.params
    const {userId} = req.body
    
    if (!id || !userId) {
        res.status(400).json({error : 'No id or userId provided'})
        return
    }
    
    try {
        const existingInteraction = await prisma.userInteraction.findUnique({
            where: {
                userId_questionId: {
                    userId: userId as string,
                    questionId: id as string
                }
            }
        })
        
        if (existingInteraction) {
            // Update existing interaction
            const updatedInteraction = await prisma.userInteraction.update({
                where: {
                    userId_questionId: {
                        userId: userId as string,
                        questionId: id as string
                    }
                },
                data: {
                    liked: !existingInteraction.liked,
                    disliked: false // Remove dislike if user likes
                }
            })
            res.json(updatedInteraction)
        } else {
            // Create new interaction
            const newInteraction = await prisma.userInteraction.create({
                data: {
                    userId: userId as string,
                    questionId: id as string,
                    liked: true,
                    disliked: false,
                    starred: false
                }
            })
            res.json(newInteraction)
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({error : 'Failed to toggle like'})
    }
})

// Toggle dislike for a question
questionsRouter.post('/question/:id/dislike', async (req, res) => {
    const {id} = req.params
    const {userId} = req.body
    
    if (!id || !userId) {
        res.status(400).json({error : 'No id or userId provided'})
        return
    }
    
    try {
        const existingInteraction = await prisma.userInteraction.findUnique({
            where: {
                userId_questionId: {
                    userId: userId as string,
                    questionId: id as string
                }
            }
        })
        
        if (existingInteraction) {
            // Update existing interaction
            const updatedInteraction = await prisma.userInteraction.update({
                where: {
                    userId_questionId: {
                        userId: userId as string,
                        questionId: id as string
                    }
                },
                data: {
                    disliked: !existingInteraction.disliked,
                    liked: false // Remove like if user dislikes
                }
            })
            res.json(updatedInteraction)
        } else {
            // Create new interaction
            const newInteraction = await prisma.userInteraction.create({
                data: {
                    userId: userId as string,
                    questionId: id as string,
                    liked: false,
                    disliked: true,
                    starred: false
                }
            })
            res.json(newInteraction)
        }
    } catch (error) {
        console.error('Error toggling dislike:', error);
        res.status(500).json({error : 'Failed to toggle dislike'})
    }
})

// Toggle star for a question
questionsRouter.post('/question/:id/star', async (req, res) => {
    const {id} = req.params
    const {userId} = req.body
    
    if (!id || !userId) {
        res.status(400).json({error : 'No id or userId provided'})
        return
    }
    
    try {
        const existingInteraction = await prisma.userInteraction.findUnique({
            where: {
                userId_questionId: {
                    userId: userId as string,
                    questionId: id as string
                }
            }
        })
        
        if (existingInteraction) {
            // Update existing interaction
            const updatedInteraction = await prisma.userInteraction.update({
                where: {
                    userId_questionId: {
                        userId: userId as string,
                        questionId: id as string
                    }
                },
                data: {
                    starred: !existingInteraction.starred
                }
            })
            res.json(updatedInteraction)
        } else {
            // Create new interaction
            const newInteraction = await prisma.userInteraction.create({
                data: {
                    userId: userId as string,
                    questionId: id as string,
                    liked: false,
                    disliked: false,
                    starred: true
                }
            })
            res.json(newInteraction)
        }
    } catch (error) {
        console.error('Error toggling star:', error);
        res.status(500).json({error : 'Failed to toggle star'})
    }
})

// Get count of problems solved by a user
questionsRouter.get('/user/:userId/solved-count', async (req, res) => {
    const {userId} = req.params
    
    if (!userId) {
        res.status(400).json({error : 'No userId provided'})
        return
    }
    
    try {
        const solvedQuestions = await prisma.submission.groupBy({
            by: ['questionId'],
            where: {
                userId: userId as string,
                status: 'AC' // Accepted submissions
            }
        })
        
        const solvedCount = solvedQuestions.length
        
        res.json({ solvedCount })
    } catch (error) {
        console.error('Error fetching solved count:', error);
        res.status(500).json({error : 'Failed to get solved count'})
    }
})

// Get total number of questions
questionsRouter.get('/total-count', async (req, res) => {
    try {
        const totalCount = await prisma.question.count()
        res.json({ totalCount })
    } catch (error) {
        console.error('Error fetching total count:', error);
        res.status(500).json({error : 'Failed to get total count'})
    }
})

// Get a random problem
questionsRouter.get('/random', async (req, res) => {
    try {
        // Get total count first
        const totalCount = await prisma.question.count()
        
        if (totalCount === 0) {
            res.status(404).json({error : 'No questions found'})
            return
        }
        
        // Generate a random skip value
        const randomSkip = Math.floor(Math.random() * totalCount)
        
        // Get a random question
        const randomQuestion = await prisma.question.findFirst({
            skip: randomSkip,
            include: {
                examples: true
            }
        })
        
        if (!randomQuestion) {
            res.status(404).json({error : 'Failed to get random question'})
            return
        }
        
        res.json(randomQuestion)
    } catch (error) {
        console.error('Error fetching random question:', error);
        res.status(500).json({error : 'Failed to get random question'})
    }
})

// Get a random unsolved problem for a user
questionsRouter.get('/random/unsolved/:userId', async (req, res) => {
    const {userId} = req.params
    
    if (!userId) {
        res.status(400).json({error : 'No userId provided'})
        return
    }
    
    try {
        // Get all questions that the user hasn't solved
        const unsolvedQuestions = await prisma.question.findMany({
            where: {
                NOT: {
                    submissions: {
                        some: {
                            userId: userId as string,
                            status: 'AC'
                        }
                    }
                }
            },
            include: {
                examples: true
            }
        })
        
        if (unsolvedQuestions.length === 0) {
            res.status(404).json({error : 'No unsolved questions found'})
            return
        }
        
        // Pick a random question from unsolved ones
        const randomIndex = Math.floor(Math.random() * unsolvedQuestions.length)
        const randomQuestion = unsolvedQuestions[randomIndex]
        
        res.json(randomQuestion)
    } catch (error) {
        console.error('Error fetching random unsolved question:', error);
        res.status(500).json({error : 'Failed to get random unsolved question'})
    }
})