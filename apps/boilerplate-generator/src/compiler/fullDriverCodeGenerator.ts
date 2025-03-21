/*
 This file is for generating the full driver code for the problem.
 
 Structure.md file:
 
 Problem name:
 Function name:
 Input Structure:
 Input Field:
 Input Field:
 Output Structure:
 Output Field:
*/

class FullDriverCodeGenerator {
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

    parseFile(inputFile : string) {
        let currentSection: string = ''
        const lines = this.parseLines(inputFile)
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

    getField(line: string, value : string) : {type : string, varName : string} | null {
        const match: string = line.replace(value, '').trim()
        const found = match.split(' ')
        if (!found[0] || !found[1]) return null
        return {
            type: found[0],
            varName: found[1]
        }
    }

    generateCppTemplate(): string {
        const inputs = this.inputField.length === 1 && this.inputField[0]
            ? `${this.mapTypeToCppType(this.inputField[0].type)} ${this.inputField[0].varName}` : this.inputField.map(field => `${this.mapTypeToCppType(field.type)} ${field.varName}`).join(', ')
            // this function is suppposed to read from the input file and generate the main function code
            // int main(int argc, char *argv[]) {
            //     int size = 0;
            //     cin >> size;
            //     vector<int> input(size);
            //     for(int i = 0; i < size; i++) {
            //         cin >> input[i];
            //     }
            //     int result = functionName(input);
            //     cout << result;
            // }
            const readInputs = this.inputField.map((field)=> {
                if(field.type.startsWith('list')) {
                    return `int size_${field.varName} = 0;\n std::cin >> size_${field.varName};\n ${this.mapTypeToCppType(field.type)} ${field.varName}(size_${field.varName});\n for(int i = 0; i < size_${field.varName}; i++) {\n    ${this.mapTypeToCppType(field.type)} ${field.varName}_item;\n    std::cin >> ${field.varName}_item;\n    ${field.varName}.push_back(${field.varName}_item);\n}`
                }
                return `${this.mapTypeToCppType(field.type)} ${field.varName}`
            })
        return `${this.outputField[0]?.type} ${this.funcName}(${inputs}) { \n   // your code goes here    return result}`
    }

    generatePythonTemplate() {

    }

    generateJSTemplate() {

    }

    mapTypeToCppType(type : string) {
        switch(type) {
            case 'int':
                return 'int'
            case 'string':
                return 'string'
            case 'double':
                return 'double'
            case 'bool':
                return 'bool'
            case 'char':
                return 'char'
            case 'list':
                return 'vector'
            case 'map':
                return 'map'
            default:
                return 'string'
        }
    }
}