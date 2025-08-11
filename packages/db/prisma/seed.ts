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

  // Question 1: Sum of Two Numbers
  const sumQuestion = await prisma.question.create({
    data: {
      title: 'Sum of Two Numbers',
      body: `Given two integers a and b, return the sum of the two integers.

Write a function that takes two numbers as input and returns their sum.

This is a fundamental problem that introduces basic arithmetic operations and function implementation.

Example 1:
Input: a = 5, b = 3
Output: 8
Explanation: 5 + 3 = 8

Example 2:
Input: a = -10, b = 20
Output: 10
Explanation: -10 + 20 = 10

Example 3:
Input: a = 0, b = 0
Output: 0
Explanation: 0 + 0 = 0

Constraints:
- -1000 <= a, b <= 1000
- Both a and b are integers
- The result will always be within the valid integer range

Follow-up: Can you solve this without using the + operator?`
    }
  })

  // Test cases for Sum of Two Numbers
  const sumTestCases = [
    // Visible test cases (users can see these)
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
    // Hidden test cases (only executed during submission)
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
      },
      {
        questionId: sumQuestion.id,
        inputData: 'a = 1000, b = 1000',
        outputData: '2000',
        explanation: '1000 + 1000 = 2000'
      },
      {
        questionId: sumQuestion.id,
        inputData: 'a = -500, b = 300',
        outputData: '-200',
        explanation: '-500 + 300 = -200'
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

  // Question 2: Find Maximum Number
  const maxQuestion = await prisma.question.create({
    data: {
      title: 'Find Maximum Number',
      body: `Given an array of integers, find and return the maximum number.

Write a function that takes an array of numbers as input and returns the largest number in the array.

This problem helps you understand array traversal and comparison operations.

Example 1:
Input: [3, 7, 2, 9, 1]
Output: 9
Explanation: 9 is the largest number in the array

Example 2:
Input: [-5, -2, -10, -1]
Output: -1
Explanation: -1 is the largest number in the array (closest to zero)

Example 3:
Input: [42]
Output: 42
Explanation: When there's only one element, it's the maximum

Example 4:
Input: [100, 200, 50, 300, 150]
Output: 300
Explanation: 300 is the largest number in the array

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
      },
      {
        questionId: maxQuestion.id,
        inputData: '[100, 200, 50, 300, 150]',
        outputData: '300',
        explanation: '300 is the largest number in the array'
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
      }
    ]
  })

  console.log('📈 Created Find Maximum Number question')

  // Question 3: Reverse String
  const reverseQuestion = await prisma.question.create({
    data: {
      title: 'Reverse String',
      body: `Given a string, reverse it and return the reversed string.

Write a function that takes a string as input and returns the string in reverse order.

This problem introduces string manipulation and helps you understand character-by-character processing.

Example 1:
Input: "hello"
Output: "olleh"
Explanation: Reverse each character: h->o, e->l, l->l, l->e, o->h

Example 2:
Input: "world"
Output: "dlrow"
Explanation: Reverse each character: w->d, o->r, r->o, l->l, d->w

Example 3:
Input: "a"
Output: "a"
Explanation: Single character remains the same when reversed

Example 4:
Input: "programming"
Output: "gnimmargorp"
Explanation: Reverse each character in the word "programming"

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
      expected: "gnimmargorP",
      isVisible: false,
      testCaseInputs: [
        { position: 0, name: 'str', value: "programming" }
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
      },
      {
        questionId: reverseQuestion.id,
        inputData: '"programming"',
        outputData: '"gnimmargorp"',
        explanation: 'Reverse each character in the word "programming"'
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
      }
    ]
  })

  console.log('🔄 Created Reverse String question')

  // Question 4: Check Even or Odd
  const evenOddQuestion = await prisma.question.create({
    data: {
      title: 'Check Even or Odd',
      body: `Given an integer, determine if it is even or odd.

Write a function that takes a number as input and returns "Even" if the number is even, or "Odd" if the number is odd.

This problem introduces conditional logic and the modulo operator, which is fundamental in programming.

Example 1:
Input: 4
Output: "Even"
Explanation: 4 is divisible by 2 (4 % 2 == 0), so it is even

Example 2:
Input: 7
Output: "Odd"
Explanation: 7 is not divisible by 2 (7 % 2 == 1), so it is odd

Example 3:
Input: 0
Output: "Even"
Explanation: 0 is divisible by 2 (0 % 2 == 0), so it is even

Example 4:
Input: -3
Output: "Odd"
Explanation: -3 is not divisible by 2 (-3 % 2 == -1), so it is odd

Example 5:
Input: 1000
Output: "Even"
Explanation: 1000 is divisible by 2 (1000 % 2 == 0), so it is even

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
    // Visible test cases
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
    // Hidden test cases
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
      },
      {
        questionId: evenOddQuestion.id,
        inputData: '1000',
        outputData: '"Even"',
        explanation: '1000 is divisible by 2 (1000 % 2 == 0), so it is even'
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
    return "";
}`
      },
      {
        questionId: evenOddQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def check_even_or_odd(num):
    # Your code here
    return ""`
      }
    ]
  })

  console.log('🔢 Created Check Even or Odd question')

  // Question 5: Two Sum
  const twoSumQuestion = await prisma.question.create({
    data: {
      title: 'Two Sum',
      body: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

This is a classic problem that introduces hash tables and the concept of complement-based searching. It's often used to teach efficient array searching techniques.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]
Explanation: Because nums[1] + nums[2] == 6, we return [1, 2].

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 6, we return [0, 1].

Example 4:
Input: nums = [0,4,3,0], target = 0
Output: [0,3]
Explanation: Because nums[0] + nums[3] == 0, we return [0, 3].

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
      },
      {
        questionId: twoSumQuestion.id,
        inputData: 'nums = [0,4,3,0], target = 0',
        outputData: '[0,3]',
        explanation: 'Because nums[0] + nums[3] == 0, we return [0, 3]'
      },
      {
        questionId: twoSumQuestion.id,
        inputData: 'nums = [-1,-2,-3,-4,-5], target = -8',
        outputData: '[2,4]',
        explanation: 'Because nums[2] + nums[4] == -8, we return [2, 4]'
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
