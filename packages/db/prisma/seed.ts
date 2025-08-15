import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.submission.deleteMany()
  await prisma.templateCode.deleteMany()
  await prisma.example.deleteMany()
  await prisma.testCaseInput.deleteMany()
  await prisma.testCase.deleteMany()
  await prisma.question.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleared existing data')

  // Question 1: Check Even or Odd
  const evenOddQuestion = await prisma.question.create({
    data: {
      title: 'Check Even or Odd',
      difficulty: 'Easy',
      body: `Given an integer, determine if it is even or odd.

Write a function that takes a number as input and returns "Even" if the number is even, or "Odd" if the number is odd.

This problem introduces conditional logic and the modulo operator, which is fundamental in programming.

Constraints:
- -1000 <= number <= 1000
- The input is always an integer
- Zero (0) is considered even
- Negative numbers can be either even or odd

Follow-up: Can you solve this without using the modulo operator?`
    }
  })

  // Test cases for Check Even or Odd
  const evenOddTestCases = [
    // Visible test cases (users can see these)
    {
      inputs: { num: 4 },
      expected: "Even",
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'num', value: 4 }
      ]
    },
    {
      inputs: { num: 7 },
      expected: "Odd",
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'num', value: 7 }
      ]
    },
    // Hidden test cases (only executed during submission)
    {
      inputs: { num: 0 },
      expected: "Even",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: 0 }
      ]
    },
    {
      inputs: { num: -3 },
      expected: "Odd",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: -3 }
      ]
    },
    {
      inputs: { num: 1000 },
      expected: "Even",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: 1000 }
      ]
    },
    {
      inputs: { num: -1000 },
      expected: "Even",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: -1000 }
      ]
    },
    {
      inputs: { num: 1 },
      expected: "Odd",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: 1 }
      ]
    },
    {
      inputs: { num: -1 },
      expected: "Odd",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: -1 }
      ]
    },
    {
      inputs: { num: 999 },
      expected: "Odd",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: 999 }
      ]
    },
    {
      inputs: { num: -999 },
      expected: "Odd",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'num', value: -999 }
      ]
    }
  ]

  for (const testCase of evenOddTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: evenOddQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Check Even or Odd
  await prisma.example.createMany({
    data: [
      {
        questionId: evenOddQuestion.id,
        inputData: '4',
        outputData: '"Even"',
        explanation: '4 is divisible by 2 (4 % 2 == 0), so it is even'
      },
      {
        questionId: evenOddQuestion.id,
        inputData: '7',
        outputData: '"Odd"',
        explanation: '7 is not divisible by 2 (7 % 2 == 1), so it is odd'
      },
      {
        questionId: evenOddQuestion.id,
        inputData: '0',
        outputData: '"Even"',
        explanation: '0 is divisible by 2 (0 % 2 == 0), so it is even'
      },
      {
        questionId: evenOddQuestion.id,
        inputData: '-3',
        outputData: '"Odd"',
        explanation: '-3 is not divisible by 2 (-3 % 2 == -1), so it is odd'
      }
    ]
  })

  // Template codes for Check Even or Odd
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: evenOddQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `function checkEvenOrOdd(num) {
    // Your code here
    // Return "Even" if the number is even, "Odd" if it's odd
    return "";
}`
      },
      {
        questionId: evenOddQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def check_even_or_odd(num):
    # Your code here
    # Return "Even" if the number is even, "Odd" if it's odd
    return ""`
      },
      {
        questionId: evenOddQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `#include <string>
using namespace std;

string checkEvenOrOdd(int num) {
    // Your code here
    // Return "Even" if the number is even, "Odd" if it's odd
    return "";
}`
      }
    ]
  })

  console.log('🔢 Created Check Even or Odd question')

  // Question 2: Sum of Two Numbers
  const sumQuestion = await prisma.question.create({
    data: {
      title: 'Sum of Two Numbers',
      difficulty: 'Easy',
      body: `Given two integers a and b, return the sum of the two integers.

Write a function that takes two numbers as input and returns their sum.

This is a fundamental problem that introduces basic arithmetic operations and function implementation.

Constraints:
- -1000 <= a, b <= 1000
- Both a and b are integers
- The result will always be within the valid integer range

Follow-up: Can you solve this without using the + operator?`
    }
  })

  // Test cases for Sum of Two Numbers
  const sumTestCases = [
    // Visible test cases
    {
      inputs: { a: 5, b: 3 },
      expected: 8,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'a', value: 5 },
        { position: 1, name: 'b', value: 3 }
      ]
    },
    {
      inputs: { a: -10, b: 20 },
      expected: 10,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'a', value: -10 },
        { position: 1, name: 'b', value: 20 }
      ]
    },
    // Hidden test cases
    {
      inputs: { a: 0, b: 0 },
      expected: 0,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'a', value: 0 },
        { position: 1, name: 'b', value: 0 }
      ]
    },
    {
      inputs: { a: 1000, b: 1000 },
      expected: 2000,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'a', value: 1000 },
        { position: 1, name: 'b', value: 1000 }
      ]
    },
    {
      inputs: { a: -500, b: 300 },
      expected: -200,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'a', value: -500 },
        { position: 1, name: 'b', value: 300 }
      ]
    },
    {
      inputs: { a: -1000, b: -1000 },
      expected: -2000,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'a', value: -1000 },
        { position: 1, name: 'b', value: -1000 }
      ]
    },
    {
      inputs: { a: 999, b: 1 },
      expected: 1000,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'a', value: 999 },
        { position: 1, name: 'b', value: 1 }
      ]
    },
    {
      inputs: { a: -999, b: -1 },
      expected: -1000,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'a', value: -999 },
        { position: 1, name: 'b', value: -1 }
      ]
    }
  ]

  for (const testCase of sumTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: sumQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Sum of Two Numbers
  await prisma.example.createMany({
    data: [
      {
        questionId: sumQuestion.id,
        inputData: 'a = 5, b = 3',
        outputData: '8',
        explanation: '5 + 3 = 8'
      },
      {
        questionId: sumQuestion.id,
        inputData: 'a = -10, b = 20',
        outputData: '10',
        explanation: '-10 + 20 = 10'
      },
      {
        questionId: sumQuestion.id,
        inputData: 'a = 0, b = 0',
        outputData: '0',
        explanation: '0 + 0 = 0'
      }
    ]
  })

  // Template codes for Sum of Two Numbers
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: sumQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `function addTwoNumbers(a, b) {
    // Your code here
    return 0;
}`
      },
      {
        questionId: sumQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def add_two_numbers(a, b):
    # Your code here
    return 0`
      },
      {
        questionId: sumQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `int addTwoNumbers(int a, int b) {
    // Your code here
    return 0;
}`
      }
    ]
  })

  console.log('➕ Created Sum of Two Numbers question')

  // Question 3: Find Maximum Number
  const maxQuestion = await prisma.question.create({
    data: {
      title: 'Find Maximum Number',
      difficulty: 'Easy',
      body: `Given an array of integers, find and return the maximum number.

Write a function that takes an array of numbers as input and returns the largest number in the array.

This problem helps you understand array traversal and comparison operations.

Constraints:
- 1 <= array length <= 1000
- -1000 <= array[i] <= 1000
- The array will always contain at least one element
- All elements in the array are integers

Follow-up: Can you find both the maximum and minimum in a single pass through the array?`
    }
  })

  // Test cases for Find Maximum Number
  const maxTestCases = [
    // Visible test cases
    {
      inputs: { arr: [3, 7, 2, 9, 1] },
      expected: 9,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [3, 7, 2, 9, 1] }
      ]
    },
    {
      inputs: { arr: [-5, -2, -10, -1] },
      expected: -1,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [-5, -2, -10, -1] }
      ]
    },
    // Hidden test cases
    {
      inputs: { arr: [42] },
      expected: 42,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [42] }
      ]
    },
    {
      inputs: { arr: [100, 200, 50, 300, 150] },
      expected: 300,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [100, 200, 50, 300, 150] }
      ]
    },
    {
      inputs: { arr: [-1000, -999, -998, -997] },
      expected: -997,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [-1000, -999, -998, -997] }
      ]
    },
    {
      inputs: { arr: [999, 998, 997, 996, 995] },
      expected: 999,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [999, 998, 997, 996, 995] }
      ]
    },
    {
      inputs: { arr: [0, 0, 0, 0, 0] },
      expected: 0,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [0, 0, 0, 0, 0] }
      ]
    },
    {
      inputs: { arr: [1, 1, 1, 1, 1] },
      expected: 1,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'arr', value: [1, 1, 1, 1, 1] }
      ]
    }
  ]

  for (const testCase of maxTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: maxQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Find Maximum Number
  await prisma.example.createMany({
    data: [
      {
        questionId: maxQuestion.id,
        inputData: '[3, 7, 2, 9, 1]',
        outputData: '9',
        explanation: '9 is the largest number in the array'
      },
      {
        questionId: maxQuestion.id,
        inputData: '[-5, -2, -10, -1]',
        outputData: '-1',
        explanation: '-1 is the largest number in the array (closest to zero)'
      },
      {
        questionId: maxQuestion.id,
        inputData: '[42]',
        outputData: '42',
        explanation: 'When there is only one element, it is the maximum'
      }
    ]
  })

  // Template codes for Find Maximum Number
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: maxQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `function findMaximum(arr) {
    // Your code here
    return 0;
}`
      },
      {
        questionId: maxQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def find_maximum(arr):
    # Your code here
    return 0`
      },
      {
        questionId: maxQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `#include <vector>
using namespace std;

int findMaximum(vector<int>& arr) {
    // Your code here
    // Return the maximum number in the array
    return 0;
}`
      }
    ]
  })

  console.log('📈 Created Find Maximum Number question')

  // Question 4: Reverse String
  const reverseQuestion = await prisma.question.create({
    data: {
      title: 'Reverse String',
      difficulty: 'Medium',
      body: `Given a string, reverse it and return the reversed string.

Write a function that takes a string as input and returns the string in reverse order.

This problem introduces string manipulation and helps you understand character-by-character processing.

Constraints:
- 1 <= string length <= 100
- String contains only lowercase letters (a-z)
- The input string is not empty
- You should handle both single character and multi-character strings

Follow-up: Can you reverse the string in-place without using extra space?`
    }
  })

  // Test cases for Reverse String
  const reverseTestCases = [
    // Visible test cases
    {
      inputs: { str: "hello" },
      expected: "olleh",
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'str', value: "hello" }
      ]
    },
    {
      inputs: { str: "world" },
      expected: "dlrow",
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'str', value: "world" }
      ]
    },
    // Hidden test cases
    {
      inputs: { str: "a" },
      expected: "a",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'str', value: "a" }
      ]
    },
    {
      inputs: { str: "programming" },
      expected: "gnimmargorp",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'str', value: "programming" }
      ]
    },
    {
      inputs: { str: "algorithm" },
      expected: "mhtirogla",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'str', value: "algorithm" }
      ]
    },
    {
      inputs: { str: "data" },
      expected: "atad",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'str', value: "data" }
      ]
    },
    {
      inputs: { str: "structure" },
      expected: "erutcurts",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'str', value: "structure" }
      ]
    },
    {
      inputs: { str: "computer" },
      expected: "retupmoc",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'str', value: "computer" }
      ]
    }
  ]

  for (const testCase of reverseTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: reverseQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Reverse String
  await prisma.example.createMany({
    data: [
      {
        questionId: reverseQuestion.id,
        inputData: '"hello"',
        outputData: '"olleh"',
        explanation: 'Reverse each character: h->o, e->l, l->l, l->e, o->h'
      },
      {
        questionId: reverseQuestion.id,
        inputData: '"world"',
        outputData: '"dlrow"',
        explanation: 'Reverse each character: w->d, o->r, r->o, l->l, d->w'
      },
      {
        questionId: reverseQuestion.id,
        inputData: '"a"',
        outputData: '"a"',
        explanation: 'Single character remains the same when reversed'
      }
    ]
  })

  // Template codes for Reverse String
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: reverseQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `function reverseString(str) {
    // Your code here
    return "";
}`
      },
      {
        questionId: reverseQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def reverse_string(s):
    # Your code here
    return ""`
      },
      {
        questionId: reverseQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `#include <string>
using namespace std;

string reverseString(string str) {
    // Your code here
    return "";
}`
      }
    ]
  })

  console.log('🔄 Created Reverse String question')

  // Question 5: Two Sum
  const twoSumQuestion = await prisma.question.create({
    data: {
      title: 'Two Sum',
      difficulty: 'Medium',
      body: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

This is a classic problem that introduces hash tables and the concept of complement-based searching. It's often used to teach efficient array searching techniques.

Constraints:
- 2 <= nums.length <= 104
- -109 <= nums[i] <= 109
- -109 <= target <= 109
- Only one valid answer exists
- You cannot use the same element twice
- The array is not necessarily sorted

Follow-up: Can you come up with an algorithm that is less than O(n²) time complexity?`
    }
  })

  // Test cases for Two Sum
  const twoSumTestCases = [
    // Visible test cases
    {
      inputs: { nums: [2, 7, 11, 15], target: 9 },
      expected: [0, 1],
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [2, 7, 11, 15] },
        { position: 1, name: 'target', value: 9 }
      ]
    },
    {
      inputs: { nums: [3, 2, 4], target: 6 },
      expected: [1, 2],
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [3, 2, 4] },
        { position: 1, name: 'target', value: 6 }
      ]
    },
    {
      inputs: { nums: [3, 3], target: 6 },
      expected: [0, 1],
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [3, 3] },
        { position: 1, name: 'target', value: 6 }
      ]
    },
    // Hidden test cases
    {
      inputs: { nums: [1, 5, 8, 10, 13], target: 18 },
      expected: [2, 4],
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [1, 5, 8, 10, 13] },
        { position: 1, name: 'target', value: 18 }
      ]
    },
    {
      inputs: { nums: [0, 4, 3, 0], target: 0 },
      expected: [0, 3],
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [0, 4, 3, 0] },
        { position: 1, name: 'target', value: 0 }
      ]
    },
    {
      inputs: { nums: [-1, -2, -3, -4, -5], target: -8 },
      expected: [2, 4],
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [-1, -2, -3, -4, -5] },
        { position: 1, name: 'target', value: -8 }
      ]
    },
    {
      inputs: { nums: [100, 200, 300, 400, 500], target: 700 },
      expected: [2, 4],
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [100, 200, 300, 400, 500] },
        { position: 1, name: 'target', value: 700 }
      ]
    },
    {
      inputs: { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target: 19 },
      expected: [8, 9],
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        { position: 1, name: 'target', value: 19 }
      ]
    },
    {
      inputs: { nums: [50, 25, 75, 100, 125, 150], target: 200 },
      expected: [3, 5],
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'nums', value: [50, 25, 75, 100, 125, 150] },
        { position: 1, name: 'target', value: 200 }
      ]
    }
  ]

  for (const testCase of twoSumTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: twoSumQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Two Sum
  await prisma.example.createMany({
    data: [
      {
        questionId: twoSumQuestion.id,
        inputData: 'nums = [2,7,11,15], target = 9',
        outputData: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1]'
      },
      {
        questionId: twoSumQuestion.id,
        inputData: 'nums = [3,2,4], target = 6',
        outputData: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2]'
      },
      {
        questionId: twoSumQuestion.id,
        inputData: 'nums = [3,3], target = 6',
        outputData: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1]'
      }
    ]
  })

  // Template codes for Two Sum
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: twoSumQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Your code here
    return [];
}`
      },
      {
        questionId: twoSumQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `from typing import List

def twoSum(nums: List[int], target: int) -> List[int]:
    # Your code here
    return []`
      },
      {
        questionId: twoSumQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        return {};
    }
};`
      }
    ]
  })

  console.log('🔢 Created Two Sum question')

  // Question 6: Palindrome Number
  const palindromeQuestion = await prisma.question.create({
    data: {
      title: 'Palindrome Number',
      difficulty: 'Medium',
      body: `Given an integer x, return true if x is a palindrome, and false otherwise.

A number is a palindrome when it reads the same backward as forward.

This problem helps you understand number manipulation and string conversion techniques.

Constraints:
- -231 <= x <= 231 - 1
- The input is always an integer

Follow-up: Can you solve this without converting the integer to a string?`
    }
  })

  // Test cases for Palindrome Number
  const palindromeTestCases = [
    // Visible test cases
    {
      inputs: { x: 121 },
      expected: true,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'x', value: 121 }
      ]
    },
    {
      inputs: { x: -121 },
      expected: false,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'x', value: -121 }
      ]
    },
    {
      inputs: { x: 10 },
      expected: false,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'x', value: 10 }
      ]
    },
    // Hidden test cases
    {
      inputs: { x: 0 },
      expected: true,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'x', value: 0 }
      ]
    },
    {
      inputs: { x: 12321 },
      expected: true,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'x', value: 12321 }
      ]
    },
    {
      inputs: { x: 12345 },
      expected: false,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'x', value: 12345 }
      ]
    },
    {
      inputs: { x: 99999 },
      expected: true,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'x', value: 99999 }
      ]
    },
    {
      inputs: { x: 123456789 },
      expected: false,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'x', value: 123456789 }
      ]
    },
    {
      inputs: { x: 123454321 },
      expected: true,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'x', value: 123454321 }
      ]
    }
  ]

  for (const testCase of palindromeTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: palindromeQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Palindrome Number
  await prisma.example.createMany({
    data: [
      {
        questionId: palindromeQuestion.id,
        inputData: '121',
        outputData: 'true',
        explanation: '121 reads as 121 from left to right and from right to left'
      },
      {
        questionId: palindromeQuestion.id,
        inputData: '-121',
        outputData: 'false',
        explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome'
      },
      {
        questionId: palindromeQuestion.id,
        inputData: '10',
        outputData: 'false',
        explanation: 'Reads 01 from right to left. Therefore it is not a palindrome'
      }
    ]
  })

  // Template codes for Palindrome Number
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: palindromeQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
    // Your code here
    return false;
}`
      },
      {
        questionId: palindromeQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def isPalindrome(x: int) -> bool:
    # Your code here
    return False`
      },
      {
        questionId: palindromeQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `class Solution {
public:
    bool isPalindrome(int x) {
        // Your code here
        return false;
    }
};`
      }
    ]
  })

  console.log('🔄 Created Palindrome Number question')

  // Question 7: Factorial
  const factorialQuestion = await prisma.question.create({
    data: {
      title: 'Factorial',
      difficulty: 'Easy',
      body: `Given a non-negative integer n, return the factorial of n.

The factorial of a number n is the product of all positive integers less than or equal to n.

This problem introduces recursion and iterative approaches to mathematical calculations.

Constraints:
- 0 <= n <= 12
- The result will fit in a 32-bit integer
- 0! = 1 by definition

Follow-up: Can you solve this using recursion? What about iteration?`
    }
  })

  // Test cases for Factorial
  const factorialTestCases = [
    // Visible test cases
    {
      inputs: { n: 5 },
      expected: 120,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'n', value: 5 }
      ]
    },
    {
      inputs: { n: 3 },
      expected: 6,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 'n', value: 3 }
      ]
    },
    // Hidden test cases
    {
      inputs: { n: 0 },
      expected: 1,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'n', value: 0 }
      ]
    },
    {
      inputs: { n: 1 },
      expected: 1,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'n', value: 1 }
      ]
    },
    {
      inputs: { n: 10 },
      expected: 3628800,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'n', value: 10 }
      ]
    },
    {
      inputs: { n: 12 },
      expected: 479001600,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'n', value: 12 }
      ]
    }
  ]

  for (const testCase of factorialTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: factorialQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Factorial
  await prisma.example.createMany({
    data: [
      {
        questionId: factorialQuestion.id,
        inputData: '5',
        outputData: '120',
        explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120'
      },
      {
        questionId: factorialQuestion.id,
        inputData: '3',
        outputData: '6',
        explanation: '3! = 3 × 2 × 1 = 6'
      },
      {
        questionId: factorialQuestion.id,
        inputData: '0',
        outputData: '1',
        explanation: '0! = 1 by definition'
      }
    ]
  })

  // Template codes for Factorial
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: factorialQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `function factorial(n) {
    // Your code here
    // Return the factorial of n
    return 0;
}`
      },
      {
        questionId: factorialQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def factorial(n):
    # Your code here
    # Return the factorial of n
    return 0`
      },
      {
        questionId: factorialQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `int factorial(int n) {
    // Your code here
    // Return the factorial of n
    return 0;
}`
      }
    ]
  })

  console.log('🔢 Created Factorial question')

  // Question 8: Valid Parentheses
  const parenthesesQuestion = await prisma.question.create({
    data: {
      title: 'Valid Parentheses',
      difficulty: 'Medium',
      body: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

This problem introduces stack data structure and bracket matching algorithms.

Constraints:
- 1 <= s.length <= 104
- s consists of parentheses only '()[]{}'

Follow-up: Can you solve this using a single pass through the string?`
    }
  })

  // Test cases for Valid Parentheses
  const parenthesesTestCases = [
    // Visible test cases
    {
      inputs: { s: "()" },
      expected: true,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 's', value: "()" }
      ]
    },
    {
      inputs: { s: "()[]{}" },
      expected: true,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 's', value: "()[]{}" }
      ]
    },
    {
      inputs: { s: "(]" },
      expected: false,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 's', value: "(]" }
      ]
    },
    // Hidden test cases
    {
      inputs: { s: "([)]" },
      expected: false,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "([)]" }
      ]
    },
    {
      inputs: { s: "{[]}" },
      expected: true,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "{[]}" }
      ]
    },
    {
      inputs: { s: "(((" },
      expected: false,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "(((" }
      ]
    },
    {
      inputs: { s: ")))" },
      expected: false,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: ")))" }
      ]
    },
    {
      inputs: { s: "({[]})" },
      expected: true,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "({[]})" }
      ]
    }
  ]

  for (const testCase of parenthesesTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: parenthesesQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Valid Parentheses
  await prisma.example.createMany({
    data: [
      {
        questionId: parenthesesQuestion.id,
        inputData: '"()"',
        outputData: 'true',
        explanation: 'Simple valid parentheses'
      },
      {
        questionId: parenthesesQuestion.id,
        inputData: '"()[]{}"',
        outputData: 'true',
        explanation: 'Multiple valid parentheses in sequence'
      },
      {
        questionId: parenthesesQuestion.id,
        inputData: '"(]"',
        outputData: 'false',
        explanation: 'Mismatched parentheses types'
      }
    ]
  })

  // Template codes for Valid Parentheses
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: parenthesesQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Your code here
    // Return true if the parentheses are valid, false otherwise
    return false;
}`
      },
      {
        questionId: parenthesesQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def isValid(s: str) -> bool:
    # Your code here
    # Return True if the parentheses are valid, False otherwise
    return False`
      },
      {
        questionId: parenthesesQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Your code here
        // Return true if the parentheses are valid, false otherwise
        return false;
    }
};`
      }
    ]
  })

  console.log('🔒 Created Valid Parentheses question')

  // Question 9: Longest Substring Without Repeating Characters
  const longestSubstringQuestion = await prisma.question.create({
    data: {
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'Hard',
      body: `Given a string s, find the length of the longest substring without repeating characters.

This problem introduces the sliding window technique and hash set usage for tracking unique characters.

Constraints:
- 0 <= s.length <= 5 * 104
- s consists of English letters, digits, symbols and spaces

Follow-up: Can you solve this in O(n) time complexity?`
    }
  })

  // Test cases for Longest Substring Without Repeating Characters
  const longestSubstringTestCases = [
    // Visible test cases
    {
      inputs: { s: "abcabcbb" },
      expected: 3,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 's', value: "abcabcbb" }
      ]
    },
    {
      inputs: { s: "bbbbb" },
      expected: 1,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 's', value: "bbbbb" }
      ]
    },
    {
      inputs: { s: "pwwkew" },
      expected: 3,
      isVisible: true,
      testCaseInputs: [
        { position: 0, name: 's', value: "pwwkew" }
      ]
    },
    // Hidden test cases
    {
      inputs: { s: "" },
      expected: 0,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "" }
      ]
    },
    {
      inputs: { s: "a" },
      expected: 1,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "a" }
      ]
    },
    {
      inputs: { s: "abcdef" },
      expected: 6,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "abcdef" }
      ]
    },
    {
      inputs: { s: "aab" },
      expected: 2,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "aab" }
      ]
    },
    {
      inputs: { s: "dvdf" },
      expected: 3,
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 's', value: "dvdf" }
      ]
    }
  ]

  for (const testCase of longestSubstringTestCases) {
    const createdTestCase = await prisma.testCase.create({
      data: {
        inputs: testCase.inputs,
        expected: testCase.expected,
        isVisible: testCase.isVisible,
        questionId: longestSubstringQuestion.id
      }
    })

    for (const input of testCase.testCaseInputs) {
      await prisma.testCaseInput.create({
        data: {
          testCaseId: createdTestCase.id,
          position: input.position,
          name: input.name,
          value: input.value
        }
      })
    }
  }

  // Examples for Longest Substring Without Repeating Characters
  await prisma.example.createMany({
    data: [
      {
        questionId: longestSubstringQuestion.id,
        inputData: '"abcabcbb"',
        outputData: '3',
        explanation: 'The answer is "abc", with the length of 3'
      },
      {
        questionId: longestSubstringQuestion.id,
        inputData: '"bbbbb"',
        outputData: '1',
        explanation: 'The answer is "b", with the length of 1'
      },
      {
        questionId: longestSubstringQuestion.id,
        inputData: '"pwwkew"',
        outputData: '3',
        explanation: 'The answer is "wke", with the length of 3'
      }
    ]
  })

  // Template codes for Longest Substring Without Repeating Characters
  await prisma.templateCode.createMany({
    data: [
      {
        questionId: longestSubstringQuestion.id,
        programmingLanguageId: 'javascript',
        driverCode: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Your code here
    // Return the length of the longest substring without repeating characters
    return 0;
}`
      },
      {
        questionId: longestSubstringQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def lengthOfLongestSubstring(s: str) -> int:
    # Your code here
    # Return the length of the longest substring without repeating characters
    return 0`
      },
      {
        questionId: longestSubstringQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `#include <string>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Your code here
        // Return the length of the longest substring without repeating characters
        return 0;
    }
};`
      }
    ]
  })

  console.log('🔍 Created Longest Substring Without Repeating Characters question')

  console.log('✅ Database seeding completed successfully!')
  console.log(`📊 Created ${await prisma.question.count()} questions`)
  console.log(`🧪 Created ${await prisma.testCase.count()} test cases`)
  console.log(`📝 Created ${await prisma.example.count()} examples`)
  console.log(`💻 Created ${await prisma.templateCode.count()} template codes`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
