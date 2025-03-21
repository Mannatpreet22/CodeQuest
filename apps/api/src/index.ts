import express, { Request, Response } from 'express'
import cors from 'cors'
import { userRouter } from './routes/userRouter'
import { questionsRouter } from './routes/questionsRouter'
import { submitRouter } from './routes/submitRouter'
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
const app = express()

const PORT  = 3000

app.use(express.json())
app.use(
    ClerkExpressWithAuth({
      secretKey: process.env.CLERK_SECRET_KEY,
    })
  );
  
app.use(cors())


app.use('/api/v1/user', userRouter)
app.use('/api/v1/questions', questionsRouter)
app.use('/api/v1/execute', submitRouter)

app.get('/', (req : Request, res : Response) => {
    res.send('Healthy Server!')
})
    
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})