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
                if(field.type.startsWith('list<')) {
                    return `int size_${field.varName} = 0;\n std::cin >> size_${field.varName};\n ${this.mapTypeToCppType(field.type)} ${field.varName}(size_${field.varName});\n for(int i = 0; i < size_${field.varName}; i++) {\n    ${this.mapTypeToCppType(field.type)} ${field.varName}_item;\n    std::cin >> ${field.varName}_item;\n    ${field.varName}.push_back(${field.varName}_item);\n}`
                }
                else if(field.type.startsWith('map<')) {
                    return `int size_${field.varName} = 0;\n std::cin >> size_${field.varName};\n ${this.mapTypeToCppType(field.type)} ${field.varName}(size_${field.varName});\n for(int i = 0; i < size_${field.varName}; i++) {\n    ${this.mapTypeToCppType(field.type)} ${field.varName}_key;\n    std::cin >> ${field.varName}_key;\n    ${this.mapTypeToCppType(field.type)} ${field.varName}_value;\n    std::cin >> ${field.varName}_value;\n    ${field.varName}.insert(std::pair<${this.mapTypeToCppType(field.type)}, ${this.mapTypeToCppType(field.type)}>(${field.varName}_key, ${field.varName}_value));\n}`
                }
                else if(field.type.startsWith('set<')) {
                    return `int size_${field.varName} = 0;\n std::cin >> size_${field.varName};\n ${this.mapTypeToCppType(field.type)} ${field.varName}(size_${field.varName});\n for(int i = 0; i < size_${field.varName}; i++) {\n    ${this.mapTypeToCppType(field.type)} ${field.varName}_item;\n    std::cin >> ${field.varName}_item;\n    ${field.varName}.insert(${field.varName}_item);\n}`
                }
                else {
                    return `std::cin >> ${field.varName}`
                }
            }).join('\n    ')
        const outputType = this.outputField[0]?.type || 'int'
        const functionCall = `${outputType} result = ${this.funcName}(${inputs});\n std::cout << result;`
        const outputField = `std::cout << result << std::endl;`

        return `
        #include <iostream>
        #include <vector>
        #include <map>
        #include <set>
        using namespace std;
        ${this.outputField[0]?.type} ${this.funcName}(${inputs}) { \n   // your code goes here    return result}
        int main(int argc, char *argv[]) {
            ${readInputs}
            ${functionCall}
            ${outputField}
            return 0;
        }
        `
    }

    generatePythonTemplate() : string {
        const inputs = this.inputField.length === 1 && this.inputField[0]
            ? `${this.inputField[0].varName}` : this.inputField.map(field => `${field.varName}`).join(', ')
        const readInputs = this.inputField.map((field)=> {
            if(field.type.startsWith('list<')) {
                return `size_${field.varName} = int(input('${field.varName} size: '))\n ${this.mapTypeToPythonType(field.type)} ${field.varName} = ${this.mapTypeToPythonType(field.type)}(${field.varName}_size)\n for i in range(${field.varName}_size):\n    ${this.mapTypeToPythonType(field.type)} ${field.varName}_item = int(input('${field.varName} item: '))\n    ${field.varName}.append(${field.varName}_item)`
            }
            else if(field.type.startsWith('map<')) {
                return `size_${field.varName} = int(input('${field.varName} size: '))\n ${this.mapTypeToPythonType(field.type)} ${field.varName} = ${this.mapTypeToPythonType(field.type)}(${field.varName}_size)\n for i in range(${field.varName}_size):\n    ${this.mapTypeToPythonType(field.type)} ${field.varName}_key = int(input('${field.varName} key: '))\n    ${this.mapTypeToPythonType(field.type)} ${field.varName}_value = int(input('${field.varName} value: '))\n    ${field.varName}.insert(${field.varName}_key, ${field.varName}_value)`
            }
            else if(field.type.startsWith('set<')) {
                return `size_${field.varName} = int(input('${field.varName} size: '))\n ${this.mapTypeToPythonType(field.type)} ${field.varName} = ${this.mapTypeToPythonType(field.type)}(${field.varName}_size)\n for i in range(${field.varName}_size):\n    ${this.mapTypeToPythonType(field.type)} ${field.varName}_item = int(input('${field.varName} item: '))\n    ${field.varName}.add(${field.varName}_item)`
            }
            else {
                return `${this.mapTypeToPythonType(field.type)} ${field.varName} = int(input('${field.varName}: '))`
            }
        }).join('\n    ')
        const outputType = this.outputField[0]?.type || 'int'
        const functionCall = `${outputType} result = ${this.funcName}(${inputs})\n print(result)`
        const outputField = `print(result)` 
        return `
        def main():
            # your code goes here
            return result
        
        if __name__ == '__main__':
            ${readInputs}
            ${functionCall}
            ${outputField}
        `
    }

    generateJSTemplate() : string {
        const inputs = this.inputField.length === 1 && this.inputField[0]
            ? `${this.inputField[0].varName}` : this.inputField.map(field => `${field.varName}`).join(', ')
        const readInputs = this.inputField.map((field)=> {
            if(field.type.startsWith('list<')) {
                return `const ${field.varName}_size = parseInt(readlineSync.question('${field.varName} size: '))\n ${this.mapTypeToJSType(field.type)} ${field.varName} = new ${this.mapTypeToJSType(field.type)}(${field.varName}_size)\n for(let i = 0; i < ${field.varName}_size; i++) {\n    const ${field.varName}_item = parseInt(readlineSync.question('${field.varName} item: '))\n    ${field.varName}.push(${field.varName}_item)\n}`
            }
            else if(field.type.startsWith('map<')) {
                return `const ${field.varName}_size = parseInt(readlineSync.question('${field.varName} size: '))\n ${this.mapTypeToJSType(field.type)} ${field.varName} = new ${this.mapTypeToJSType(field.type)}()\n for(let i = 0; i < ${field.varName}_size; i++) {\n    const ${field.varName}_key = parseInt(readlineSync.question('${field.varName} key: '))\n    const ${field.varName}_item = parseInt(readlineSync.question('${field.varName} item: '))\n    ${field.varName}.set(${field.varName}_key, ${field.varName}_item)\n}`
            }
            else if(field.type.startsWith('set<')) {
                return `const ${field.varName}_size = parseInt(readlineSync.question('${field.varName} size: '))\n ${this.mapTypeToJSType(field.type)} ${field.varName} = new ${this.mapTypeToJSType(field.type)}()\n for(let i = 0; i < ${field.varName}_size; i++) {\n    const ${field.varName}_item = parseInt(readlineSync.question('${field.varName} item: '))\n    ${field.varName}.add(${field.varName}_item)\n}`
            }
            else if(field.type.startsWith('tuple<')) {
                return `const ${field.varName}_size = parseInt(readlineSync.question('${field.varName} size: '))\n ${this.mapTypeToJSType(field.type)} ${field.varName} = new ${this.mapTypeToJSType(field.type)}(${field.varName}_size)\n for(let i = 0; i < ${field.varName}_size; i++) {\n    const ${field.varName}_item = parseInt(readlineSync.question('${field.varName} item: '))\n    ${field.varName}.push(${field.varName}_item)\n}`
            }
            else {
                return `${this.mapTypeToJSType(field.type)} ${field.varName} = parseInt(readlineSync.question('${field.varName}: '))`
            }
        }).join('\n    ')
        const outputType = this.outputField[0]?.type || 'int'
        const functionCall = `const result = ${this.funcName}(${inputs})\nconsole.log(result)`
        const outputField = `console.log(result)`
        return `
        const readlineSync = require('readline-sync')
        ${this.outputField[0]?.type} ${this.funcName}(${inputs}) { \n   // your code goes here    return result}
        
        const main = () => {
            ${readInputs}
            ${functionCall}
            ${outputField}
        }
        main()
        `
    }

    private mapTypeToJSType(type: string): string {
        if (type.startsWith('list')) {
            const innerType = type.replace('list', '').trim() || 'int'
            return `Array[${this.mapTypeToJSType(innerType)}]`
        }
        else if(type.startsWith('map')) {
            const innerType = type.replace('map', '').trim() || 'int'
            return `Map[${this.mapTypeToJSType(innerType)}]`
        }
        else if(type.startsWith('set')) {
            const innerType = type.replace('set', '').trim() || 'int'
            return `Set[${this.mapTypeToJSType(innerType)}]`
        }
        else if(type.startsWith('tuple')) {
            const innerType = type.replace('tuple', '').trim() || 'int'
            return `Array[${this.mapTypeToJSType(innerType)}]`
        }
        else {
            switch(type) {
                case 'string':
                    return 'string'
                case 'int':
                    return 'number'
                case 'bool':
                    return 'boolean'
                case 'float':
                    return 'number'
                case 'double':
                    return 'number'
                default:
                    return 'number'
            }
        }
    }
    private mapTypeToPythonType(type: string): string {
        if (type.startsWith('list')) {
            const innerType = type.replace('list', '').trim() || 'int'
            return `list[${this.mapTypeToPythonType(innerType)}]`
        }
        else if(type.startsWith('map')) {
            const innerType = type.replace('map', '').trim() || 'int'
            return `dict[${this.mapTypeToPythonType(innerType)}]`
        }
        else if(type.startsWith('set')) {
            const innerType = type.replace('set', '').trim() || 'int'
            return `set[${this.mapTypeToPythonType(innerType)}]`
        }
        else if(type.startsWith('tuple')) {
            const innerType = type.replace('tuple', '').trim() || 'int'
            return `tuple[${this.mapTypeToPythonType(innerType)}]`
        }
        else {
            switch(type) {
                case 'string':
                    return 'str'
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
    }

    private mapTypeToCppType(type: string): string {
        if (type.startsWith('list')) {
            const innerType = type.replace('list', '').trim() || 'int'
            return `vector<${this.mapTypeToCppType(innerType)}>`
        }
        else if(type.startsWith('map')) {
            const innerType = type.replace('map', '').trim() || 'int'
            return `map<${this.mapTypeToCppType(innerType)}>`
        }
        else if(type.startsWith('set')) {
            const innerType = type.replace('set', '').trim() || 'int'
            return `set<${this.mapTypeToCppType(innerType)}>`
        }
        else if(type.startsWith('tuple')) {
            const innerType = type.replace('tuple', '').trim() || 'int'
            return `tuple<${this.mapTypeToCppType(innerType)}>`
        }
        else {
            switch(type) {
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
    }
}