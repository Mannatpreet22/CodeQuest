// write test for the coed compiler

import { TemplateCompiler } from './compiler/codeCompiler'

const compiler = new TemplateCompiler()
compiler.parseFile()
console.log(compiler.generateCppTemplate())
console.log(compiler.generatePythonTemplate())
console.log(compiler.generateJSTemplate())