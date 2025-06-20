import prisma from '@repo/db/client'
import simpleGit from 'simple-git'
import fs from 'fs'
import path from 'path'

const git = simpleGit()

function parseStructureMd(filePath: string): { title: string } {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const line : string | undefined = lines[0]
    let title : string | undefined = undefined
    if (line) {
        const part = line.split(':')
        if (part.length >= 2) {
            title = part[1]?.trim()
        }
    }

    return {
        title : title ?? 'Unknown'
    }
}

function deleteDirectoryRecursive(dirPath: string) {
    if (fs.existsSync(dirPath)) {
        try {
            fs.readdirSync(dirPath).forEach((file) => {
                const curPath = path.join(dirPath, file)
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteDirectoryRecursive(curPath)
                } else {
                    fs.unlinkSync(curPath)
                }
            })
            fs.rmdirSync(dirPath)
        } catch (error) {
            console.error(`Error deleting directory ${dirPath}:`, error)
            throw error
        }
    }
}

async function seed() {
    const tmpDir = path.resolve(__dirname, '../tmp-questions')
    const repoUrl = process.env.REPO_URL!

    try {
        if (!fs.existsSync(tmpDir)) {
            await git.clone(repoUrl, tmpDir)
        } else {
            await git.cwd(tmpDir).pull()
        }

        const questionsDir = path.join(tmpDir, 'test-cases')
        const problemDirs = fs.readdirSync(questionsDir).filter(file =>
            fs.statSync(path.join(questionsDir, file)).isDirectory()
        )

        for (const problemDir of problemDirs) {
            const problemPath = path.join(questionsDir, problemDir)
            const problemMdPath = path.join(problemPath, 'Problem.md')
            const structureMdPath = path.join(problemPath, 'Structure.md')

            if (fs.existsSync(problemMdPath) && fs.existsSync(structureMdPath)) {
                const body = fs.readFileSync(problemMdPath, 'utf-8')
                const structure = parseStructureMd(structureMdPath)
                const title = structure.title

                if (title !== 'Unknown') {
                    await prisma.question.upsert({
                        where: { title: title },
                        update: {
                            body
                        },
                        create: {
                            title,
                            body,
                        }
                    });
                    console.log(`Upserted question: ${title}`);
                }
                else {
                    throw new Error(`Title not found for problem: ${problemDir}`)
                }
            }
        }
    } catch (err : any) {
        throw new Error(`Error seeding questions: ${err.message}`)
    } finally {
        if (fs.existsSync(tmpDir)) {
            deleteDirectoryRecursive(tmpDir)
            console.log('Cleaned up temporary directory')
        }
    }
    
}

seed().then(() => {
    console.log('Seeding complete!')
    process.exit(0)
}).catch((err) => {
    console.error(err)
    process.exit(1)
})