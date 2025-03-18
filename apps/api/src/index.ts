import express from 'express'
import cors from 'cors'
const app = express()

const PORT  = 3000

app.use(express.json())

app.use(cors())

app.use('/api/v1/user', userRouter)
app.use('/api/v1/questions', questionsRouter)
app.use('/api/v1/execute', submitRouter)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})