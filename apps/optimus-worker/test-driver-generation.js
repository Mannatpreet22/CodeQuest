// Comprehensive test for driver code generation
// Tests all problem types: single param, two params, arrays, strings

// Test cases for different problem types
const testProblems = {
    // Single parameter problems
    singleParam: {
        javascript: `function checkEvenOrOdd(num) {
    if (num % 2 === 0) {
        return "Even";
    } else {
        return "Odd";
    }
}`,
        python: `def check_even_or_odd(num):
    if num % 2 == 0:
        return "Even"
    else:
        return "Odd"`,
        cpp: `string checkEvenOrOdd(int num) {
    if (num % 2 == 0) {
        return "Even";
    } else {
        return "Odd";
    }
}`
    },

    // Two parameter problems
    twoParams: {
        javascript: `function addTwoNumbers(a, b) {
    return a + b;
}`,
        python: `def add_two_numbers(a, b):
    return a + b`,
        cpp: `int addTwoNumbers(int a, int b) {
    return a + b;
}`
    },

    // Array problems
    arrayProblem: {
        javascript: `function findMaximum(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}`,
        python: `def find_maximum(arr):
    max_val = arr[0]
    for num in arr[1:]:
        if num > max_val:
            max_val = num
    return max_val`,
        cpp: `int findMaximum(vector<int>& arr) {
    int max = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}`
    },

    // String problems
    stringProblem: {
        javascript: `function reverseString(str) {
    return str.split('').reverse().join('');
}`,
        python: `def reverse_string(s):
    return s[::-1]`,
        cpp: `string reverseString(string str) {
    reverse(str.begin(), str.end());
    return str;
}`
    },

    // Two Sum problem (special case)
    twoSum: {
        javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
        python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
        cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`
    }
};

// Mock the OptimusWorker class methods for testing
class MockOptimusWorker {
    generateJavaScriptDriver(code) {
        // Improved function extraction for JavaScript
        let functionMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/);
        
        if (!functionMatch) {
            // Try arrow function pattern
            functionMatch = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)\}/);
        }
        
        if (!functionMatch) {
            // Try function expression pattern
            functionMatch = code.match(/(\w+)\s*:\s*function\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/);
        }
        
        if (!functionMatch) {
            return 'ERROR: Could not extract JavaScript function';
        }

        const functionName = functionMatch[1];
        const params = functionMatch[2] ? functionMatch[2].split(',').map(p => p.trim()) : [];
        const functionBody = functionMatch[3];
        
        return `
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ${functionName}(${params.join(', ')}) {
${functionBody}
}

rl.on('line', (input) => {
    try {
        const parts = input.trim().split(' ');
        ${this.generateJavaScriptInputParsing(params)}
        
        const result = ${functionName}(${params.map((_, i) => `values[${i}]`).join(', ')});
        
        if (Array.isArray(result)) {
            result.forEach(item => console.log(item));
        } else {
            console.log(result);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
    }
});`;
    }

    generateJavaScriptInputParsing(params) {
        if (params.length === 1) {
            return `const values = [Number(parts[0])];`;
        } else if (params.length === 2) {
            // Check if first param is likely an array
            if (params[0].includes('arr') || params[0].includes('nums')) {
                return `const values = [parts.slice(0, -1).map(Number), Number(parts[parts.length - 1])];`;
            } else {
                return `const values = [Number(parts[0]), Number(parts[1])];`;
            }
        }
        return `const values = parts.map(Number);`;
    }

    generatePythonDriver(code) {
        let functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*\n([\s\S]*?)(?=\n\s*def\s+\w+\s*\(|\n\s*$|\n\s*\n\s*\n)/);
        
        if (!functionMatch) {
            functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*\n([\s\S]*)/);
        }
        
        if (functionMatch && functionMatch[1] && functionMatch[2] && functionMatch[3]) {
            const functionName = functionMatch[1];
            const params = functionMatch[2].split(',').map(p => p.trim());
            const functionBody = functionMatch[3];
            
            return this.generateCompletePythonDriver(functionName, params, functionBody);
        }
        
        return 'ERROR: Could not extract Python function';
    }

    generateCompletePythonDriver(functionName, params, functionBody) {
        return `def ${functionName}(${params.join(', ')}):
${functionBody}

import sys

try:
    input_line = sys.stdin.readline().strip()
    parts = input_line.split()
    
    ${this.generatePythonInputParsing(params)}
    
    result = ${functionName}(${params.map(p => p.trim()).join(', ')})
    
    if result is None:
        print("None")
    elif isinstance(result, list):
        for item in result:
            print(item)
    elif isinstance(result, bool):
        print(str(result))
    elif isinstance(result, (int, float)):
        print(result)
    else:
        print(str(result))
        
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)`;
    }

    generatePythonInputParsing(params) {
        if (params.length === 1) {
            return `${params[0]} = int(parts[0])`;
        } else if (params.length === 2) {
            if (params[0].includes('arr') || params[0].includes('nums')) {
                return `${params[0]} = [int(x) for x in parts[:-1]]
${params[1]} = int(parts[-1])`;
            } else {
                return `${params[0]} = int(parts[0])
${params[1]} = int(parts[1])`;
            }
        }
        return params.map((param, i) => `${param} = int(parts[${i}])`).join('\n    ');
    }

    generateCppDriver(code) {
        let functionMatch = code.match(/(\S+)\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/);
        
        if (!functionMatch || !functionMatch[1] || !functionMatch[2] || !functionMatch[3] || !functionMatch[4]) {
            return 'ERROR: Could not extract C++ function';
        }

        const returnType = functionMatch[1];
        const functionName = functionMatch[2];
        const params = functionMatch[3].split(',').map(p => p.trim());
        const functionBody = functionMatch[4];

        return this.generateCppDriverCode(returnType, functionName, params, functionBody);
    }

    generateCppDriverCode(returnType, functionName, params, functionBody) {
        return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

${returnType} ${functionName}(${params.join(', ')}) {
${functionBody}
}

int main() {
    string input;
    getline(cin, input);
    
    stringstream ss(input);
    string token;
    vector<string> tokens;
    
    while (ss >> token) {
        tokens.push_back(token);
    }
    
    ${this.generateCppInputParsing(params)}
    
    ${returnType} result = ${functionName}(${params.map((param, i) => param.split(' ').pop() || `param${i}`).join(', ')});
    
    if constexpr (is_same_v<${returnType}, vector<int>>) {
        for (int i = 0; i < result.size(); i++) {
            cout << result[i] << endl;
        }
    } else if constexpr (is_same_v<${returnType}, vector<string>>) {
        for (int i = 0; i < result.size(); i++) {
            cout << result[i] << endl;
        }
    } else {
        cout << result << endl;
    }
    
    return 0;
}`;
    }

    generateCppInputParsing(params) {
        if (params.length === 1) {
            const paramName = params[0].split(' ').pop();
            const typeName = params[0].split(' ')[0];
            if (typeName.includes('vector')) {
                return `${typeName} ${paramName} = ${typeName}(tokens.begin(), tokens.end());`;
            } else {
                return `${typeName} ${paramName} = stoi(tokens[0]);`;
            }
        } else if (params.length === 2) {
            if (params[0].includes('vector')) {
                return `vector<int> ${params[0].split(' ').pop()} = vector<int>(tokens.begin(), tokens.end() - 1);
int ${params[1].split(' ').pop()} = stoi(tokens[tokens.size() - 1]);`;
            } else {
                return `int ${params[0].split(' ').pop()} = stoi(tokens[0]);
int ${params[1].split(' ').pop()} = stoi(tokens[1]);`;
            }
        }
        return params.map((param, i) => {
            const paramName = param.split(' ').pop();
            const typeName = param.split(' ')[0];
            if (typeName.includes('vector')) {
                return `${typeName} ${paramName} = ${typeName}(tokens.begin(), tokens.end());`;
            } else {
                return `${typeName} ${paramName} = stoi(tokens[${i}]);`;
            }
        }).join('\n    ');
    }
}

// Test function
function testDriverGeneration() {
    console.log('🧪 Testing Driver Code Generation for All Problem Types\n');
    
    const worker = new MockOptimusWorker();
    
    // Test each problem type
    Object.entries(testProblems).forEach(([problemType, languages]) => {
        console.log(`\n=== Testing ${problemType.toUpperCase()} ===`);
        
        Object.entries(languages).forEach(([lang, code]) => {
            console.log(`\n--- ${lang.toUpperCase()} ---`);
            console.log('Original Code:');
            console.log(code);
            
            let generatedCode;
            try {
                if (lang === 'javascript') {
                    generatedCode = worker.generateJavaScriptDriver(code);
                } else if (lang === 'python') {
                    generatedCode = worker.generatePythonDriver(code);
                } else if (lang === 'cpp') {
                    generatedCode = worker.generateCppDriver(code);
                }
                
                if (generatedCode.startsWith('ERROR:')) {
                    console.log('❌ ERROR:', generatedCode);
                } else {
                    console.log('✅ Generated Driver Code:');
                    console.log(generatedCode);
                }
            } catch (error) {
                console.log('❌ EXCEPTION:', error.message);
            }
        });
    });
    
    console.log('\n✅ All tests completed!');
}

// Run the tests
testDriverGeneration(); 