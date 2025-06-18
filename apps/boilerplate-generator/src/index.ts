import { FullDriverCodeGenerator } from './compiler/fullDriverCodeGenerator'
import { TemplateCompiler } from './compiler/codeCompiler'
const fullDriverCodeGenerator = new FullDriverCodeGenerator('./Structure.md')
// const templateCompiler = new TemplateCompiler()
// templateCompiler.parseFile('./Structure.md')
// console.log(templateCompiler.generateCppTemplate())
// console.log(templateCompiler.generatePythonTemplate())
// console.log(templateCompiler.generateJSTemplate())
console.log(fullDriverCodeGenerator.generateCppDriver())
// console.log(fullDriverCodeGenerator.generatePythonDriver())
// console.log(fullDriverCodeGenerator.generateJSTriver())