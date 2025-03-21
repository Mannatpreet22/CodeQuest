/*
Structue for the file: (Structure.md file)

Problem name:
Function name:
Input Structure:
Input Field:
Input Field:
Output Structure:
Output Field:
Output Field:

*/

import fs from 'fs'

const FILE_PATH = '../Structure.md'

export class TemplateCompiler {
    problemName : string = ''
    funcName : string = ''
    inputField : {type : string, varName : string}[] = []
    outputField : {type : string, varName : string}[] = []
    constructor() {
        this.problemName = ''
        this.funcName = ''
        this.inputField = []
        this.outputField = []
    }

    // read structure file
    parseFile() {

        let currentSection: string = ''
        let file = fs.readFileSync(FILE_PATH, 'utf-8')
        if(!file) {
            return 'File not found!'
        }

        const lines = this.parseLines(file)
        lines.map((line :string) => {
            if(line.startsWith('Problem name:')) {
                this.problemName = line.replace('Problem name:', '').trim()
            }
            else if(line.startsWith('Function name:')) {
                this.funcName = line.replace('Function Name:','').trim()
            }
            else if(line.startsWith('Input Structure:')) {
                currentSection = 'input'
            }
            else if(line.startsWith('Output Field:')) {
                currentSection = 'output'
            }
            else if(line.startsWith('Input Field:')) {
                if(currentSection === 'input')  {
                    const field = this.getField(line,'Input Field:')
                    if (field) this.inputField.push(field)
                }
            }
            else if(line.startsWith('Output Field:')) {
                if(currentSection === 'output') {
                    const field = this.getField(line,'Output Field:')
                    if(field)   this.outputField.push(field)
                }
            }
        })
    }

    parseLines(file : string) {
        return file.split('\n').map(line => line.trim()) 
    }

    getValue(line: string, remove : string) {
        return line.replace(remove,'').trim()
    }

    getField(line: string, value : string) : {type : string, varName : string} | null {
        const match: string = line.replace(value, '').trim()
        const found = match.split(' ')
        if (!found[0] || !found[1]) return null
        return {
            type: found[0],
            varName: found[1]
        }
    }

    generateCppTemplate() {
        const inputs = this.inputField.length === 1 && this.inputField[0]
            ? `${this.mapTypeToCppType(this.inputField[0].type)} ${this.inputField[0].varName}` 
            : this.inputField.map(field => `${this.mapTypeToCppType(field.type)} ${field.varName}`).join(', ')
        return `${this.mapTypeToCppType(this.outputField[0]?.type || 'int')} ${this.funcName}(${inputs}) {\n    // your code goes here\n    return result;\n}`
    }

    private mapTypeToCppType(type: string): string {
        switch(type) {
            case 'list':
                return 'vector<int>'
            case 'string':
                return 'string'
            case 'int':
                return 'int'
            case 'bool':
                return 'bool'
            case 'float':
                return 'float'
            case 'double':
                return 'double'
            default:
                return 'int'
        }
    }

    generatePythonTemplate() {
        const inputs = this.inputField.length === 1 && this.inputField[0]
            ? `${this.inputField[0].varName}` : this.inputField.map(field => `${field.varName}`).join(', ')
        return `def ${this.funcName}(${inputs}):\n    # your code goes here\n    return result`
    }

    generateJSTemplate() {
        const inputs = this.inputField.length === 1 && this.inputField[0]
            ? `${this.inputField[0].varName}` : this.inputField.map(field => `${field.varName}`).join(', ')
        return `function ${this.funcName}(${inputs}) {\n    // your code goes here\n    return result\n}`
    }
}