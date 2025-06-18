// File: apps/boilerplate-generator/src/compiler/fullDriverCodeGenerator.ts

import fs from 'fs';
import path from 'path';
import { TemplateCompiler } from './codeCompiler';

export class FullDriverCodeGenerator {
  private compiler: TemplateCompiler;

  constructor(structureFilePath: string) {
    // 1. Read the raw Markdown from disk
    const fullPath = path.resolve(process.cwd(), structureFilePath)
    const rawMd = fs.readFileSync(fullPath, 'utf-8');

    // 2. Create a TemplateCompiler, parse the Markdown, and hold on to the extracted fields:
    this.compiler = new TemplateCompiler();
    this.compiler.parseFile(structureFilePath);
  }

  /**
   * Generates a complete C++ driver (includes headers, function stub, main(), and I/O logic)
   */
  public generateCppDriver(): string {
    const funcName = this.compiler.funcName
    const inputsArr = this.compiler.inputField   // each: { type: string, varName: string }
    const outputArr = this.compiler.outputField   // each: { type: string, varName: string }

    // 1. Build the parameter‐list for the function signature
    const paramsList = inputsArr.length === 1
      ? `${this.mapTypeToCppType(inputsArr[0]?.type || 'int')} ${inputsArr[0]?.varName || 'int'}`
      : inputsArr
          .map(field => `${this.mapTypeToCppType(field.type)} ${field.varName}`)
          .join(', ');

    // 2. Build the code that reads each input from stdin
    const readInputsCode = inputsArr
      .map(field => {
        const { type, varName } = field
        if (type.startsWith('vector<') || type.startsWith('list<')) {
          // e.g. vector<int> nums  → read a size, then push_back each item
          const innerType = type.replace('vector<', '').replace('list<', '').replace('>', '')
          return [
            `int size_${varName} = 0;`,
            `std::cin >> size_${varName};`,
            `${this.mapTypeToCppType(type)} ${varName};`,
            `for (int i = 0; i < size_${varName}; i++) {`,
            `  ${this.mapTypeToCppType(innerType)} ${varName}_item;`,
            `  std::cin >> ${varName}_item;`,
            `  ${varName}.push_back(${varName}_item);`,
            `}`
          ].join('\n    ')
        }
        else if (type.startsWith('map<')) {
          return [
            `int size_${varName} = 0;`,
            `std::cin >> size_${varName};`,
            `${this.mapTypeToCppType(type)} ${varName};`,
            `for (int i = 0; i < size_${varName}; i++) {`,
            `  ${this.mapTypeToCppType(type)}::key_type ${varName}_key;`,
            `  ${this.mapTypeToCppType(type)}::mapped_type ${varName}_value;`,
            `  std::cin >> ${varName}_key;`,
            `  std::cin >> ${varName}_value;`,
            `  ${varName}.insert({${varName}_key, ${varName}_value});`,
            `}`
          ].join('\n    ');
        }
        else if (type.startsWith('set<')) {
          return [
            `int size_${varName} = 0;`,
            `std::cin >> size_${varName};`,
            `${this.mapTypeToCppType(type)} ${varName};`,
            `for (int i = 0; i < size_${varName}; i++) {`,
            `  ${this.mapTypeToCppType(type)} ${varName}_item;`,
            `  std::cin >> ${varName}_item;`,
            `  ${varName}.insert(${varName}_item);`,
            `}`
          ].join('\n    ');
        }
        // Primitive or single value:
        return `std::cin >> ${varName};`;
      })
      .join('\n    ');

    // 3. Build the function‐call + printing logic
    const returnType = outputArr[0]?.type ?? 'int'
    const mappedReturnType = this.mapTypeToCppType(returnType)
    const callLine = `${mappedReturnType} result = ${funcName}(${inputsArr
      .map(f => f.varName)
      .join(', ')});`

    const printLine = `std::cout << result << std::endl;`

    // 4. Assemble the full C++ source
    return `
#include <iostream>
#include <vector>
#include <unordered_map>
#include <map>
#include <set>
using namespace std;

# FUNCTION GOES HERE

int main(int argc, char *argv[]) {
    ${readInputsCode}
    
    ${callLine}
    ${printLine}
    return 0;
}
`.trim();
  }

  /**
   * Generates a complete Python driver (reads inputs via input(), calls function, prints output).
   */
  public generatePythonDriver(): string {
    const funcName = this.compiler.funcName;
    const inputsArr = this.compiler.inputField;
    const outputArr = this.compiler.outputField;

    // 1. Build parameter list for the function signature
    const paramsList = inputsArr.length === 1
      ? inputsArr[0]?.varName || 'int'
      : inputsArr.map(f => f.varName).join(', ');

    // 2. Build code to read inputs from stdin
    const readInputsCode = inputsArr
      .map(field => {
        const { type, varName } = field;
        if (type.startsWith('list<')) {
          // list<int> nums → read size, then loop
          return [
            `${varName}_size = int(input("${varName} size: "))`,
            `${varName} = []`,
            `for _ in range(${varName}_size):`,
            `    ${varName}.append(int(input("${varName} item: ")))`
          ].join('\n    ');
        }
        else if (type.startsWith('map<')) {
          // map<int,int> mp → read size, then key/value pairs
          return [
            `${varName}_size = int(input("${varName} size: "))`,
            `${varName} = {}`,
            `for _ in range(${varName}_size):`,
            `    key = int(input("${varName} key: "))`,
            `    value = int(input("${varName} value: "))`,
            `    ${varName}[key] = value`
          ].join('\n    ');
        }
        else if (type.startsWith('set<')) {
          return [
            `${varName}_size = int(input("${varName} size: "))`,
            `${varName} = set()`,
            `for _ in range(${varName}_size):`,
            `    val = int(input("${varName} item: "))`,
            `    ${varName}.add(val)`
          ].join('\n    ');
        }
        // Primitive or single value:
        return `${varName} = int(input("${varName}: "))`;
      })
      .join('\n    ');

    // 3. Build function‐call + print
    const callLine = `result = ${funcName}(${inputsArr.map(f => f.varName).join(', ')})`;
    const printLine = `print(result)`;

    // 4. Assemble full Python source
    return `
def ${funcName}(${paramsList}):
    # TODO: implement solution
    return 0

if __name__ == "__main__":
    ${readInputsCode}
    ${callLine}
    ${printLine}
`.trim();
  }

  /**
   * Generates a complete JavaScript driver (uses readline‐sync to read inputs, calls function, prints output).
   */
  public generateJSTriver(): string {
    const funcName = this.compiler.funcName;
    const inputsArr = this.compiler.inputField;
    const outputArr = this.compiler.outputField;

    // 1. Build parameter list for the function signature
    const paramsList = inputsArr.length === 1
      ? inputsArr[0]?.varName || 'int'
      : inputsArr.map(f => f.varName).join(', ');

    // 2. Build code to read inputs from stdin (via readline‐sync)
    const readInputsCode = inputsArr
      .map(field => {
        const { type, varName } = field;
        if (type.startsWith('list<')) {
          return [
            `const ${varName}_size = parseInt(readlineSync.question("${varName} size: "));`,
            `let ${varName} = [];`,
            `for (let i = 0; i < ${varName}_size; i++) {`,
            `  ${varName}.push(parseInt(readlineSync.question("${varName} item: ")));`,
            `}`
          ].join('\n    ');
        }
        else if (type.startsWith('map<')) {
          return [
            `const ${varName}_size = parseInt(readlineSync.question("${varName} size: "));`,
            `let ${varName} = new Map();`,
            `for (let i = 0; i < ${varName}_size; i++) {`,
            `  const key = parseInt(readlineSync.question("${varName} key: "));`,
            `  const value = parseInt(readlineSync.question("${varName} value: "));`,
            `  ${varName}.set(key, value);`,
            `}`
          ].join('\n    ');
        }
        else if (type.startsWith('set<')) {
          return [
            `const ${varName}_size = parseInt(readlineSync.question("${varName} size: "));`,
            `let ${varName} = new Set();`,
            `for (let i = 0; i < ${varName}_size; i++) {`,
            `  ${varName}.add(parseInt(readlineSync.question("${varName} item: ")));`,
            `}`
          ].join('\n    ');
        }
        // Primitive or single value:
        return `const ${varName} = parseInt(readlineSync.question("${varName}: "));`;
      })
      .join('\n    ');

    // 3. Build function‐call + print
    const callLine = `const result = ${funcName}(${inputsArr.map(f => f.varName).join(', ')});`;
    const printLine = `console.log(result);`;

    // 4. Assemble full JS source
    return `
const readlineSync = require("readline-sync");

function ${funcName}(${paramsList}) {
    // TODO: implement solution
    return 0;
}

function main() {
    ${readInputsCode}
    ${callLine}
    ${printLine}
}

main();
`.trim();
  }

  // ———————————
  // Helper: Map a "markdown type" (e.g. "vector<int>") into valid C++ syntax 
  private mapTypeToCppType(type: string): string {
    if (type.startsWith('vector<') || type.startsWith('list<')) {
      const inner = type.replace(/^(vector|list)<|>$/g, '');
      return `vector<${this.mapTypeToCppType(inner)}>`;
    }
    if (type.startsWith('map<')) {
      const inner = type.replace(/^map<|>$/g, '');
      return `map<${inner.replace(',', ', ')}>`;
    }
    if (type.startsWith('set<')) {
      const inner = type.replace(/^set<|>$/g, '');
      return `set<${this.mapTypeToCppType(inner)}>`;
    }
    if (type.startsWith('tuple<')) {
      const inner = type.replace(/^tuple<|>$/g, '');
      return `tuple<${inner.replace(',', ', ')}>`;
    }

    switch (type) {
      case 'string': return 'string';
      case 'int': return 'int';
      case 'bool': return 'bool';
      case 'float': return 'float';
      case 'double': return 'double';
      default: return 'int'; 
    }
  }
}