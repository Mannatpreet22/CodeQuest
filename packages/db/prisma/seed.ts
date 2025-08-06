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

  // Users will be created automatically via Clerk webhooks
  console.log('👤 Users will be created via Clerk webhooks')

  // Question 1: Sum of Two Numbers
  const sumQuestion = await prisma.question.create({
    data: {
      title: 'Sum of Two Numbers',
      body: `Given two integers a and b, return the sum of the two integers.

Write a function that takes two numbers as input and returns their sum.

Example:
Input: a = 5, b = 3
Output: 8

Constraints:
- -1000 <= a, b <= 1000`
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
}

// Test cases
console.log(addTwoNumbers(5, 3)); // Should output: 8
console.log(addTwoNumbers(-10, 20)); // Should output: 10`
      },
      {
        questionId: sumQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def add_two_numbers(a, b):
    # Your code here
    return 0

# Test cases
print(add_two_numbers(5, 3))  # Should output: 8
print(add_two_numbers(-10, 20))  # Should output: 10`
      },
      {
        questionId: sumQuestion.id,
        programmingLanguageId: 'cpp',
        driverCode: `#include <iostream>
using namespace std;

int addTwoNumbers(int a, int b) {
    // Your code here
    return 0;
}

int main() {
    cout << addTwoNumbers(5, 3) << endl;    // Should output: 8
    cout << addTwoNumbers(-10, 20) << endl; // Should output: 10
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

Example:
Input: [3, 7, 2, 9, 1]
Output: 9

Constraints:
- 1 <= array length <= 1000
- -1000 <= array[i] <= 1000`
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
        explanation: '-1 is the largest number in the array'
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
}

// Test cases
console.log(findMaximum([3, 7, 2, 9, 1])); // Should output: 9
console.log(findMaximum([-5, -2, -10, -1])); // Should output: -1`
      },
      {
        questionId: maxQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def find_maximum(arr):
    # Your code here
    return 0

# Test cases
print(find_maximum([3, 7, 2, 9, 1]))  # Should output: 9
print(find_maximum([-5, -2, -10, -1]))  # Should output: -1`
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

Example:
Input: "hello"
Output: "olleh"

Constraints:
- 1 <= string length <= 100
- String contains only lowercase letters`
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
}

// Test cases
console.log(reverseString("hello")); // Should output: olleh
console.log(reverseString("world")); // Should output: dlrow`
      },
      {
        questionId: reverseQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def reverse_string(s):
    # Your code here
    return ""

# Test cases
print(reverse_string("hello"))  # Should output: olleh
print(reverse_string("world"))  # Should output: dlrow`
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

Example:
Input: 4
Output: "Even"

Input: 7
Output: "Odd"

Constraints:
- -1000 <= number <= 1000`
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
        explanation: '4 is divisible by 2, so it is even'
      },
      {
        questionId: evenOddQuestion.id,
        inputData: '7',
        outputData: '"Odd"',
        explanation: '7 is not divisible by 2, so it is odd'
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
}

// Test cases
console.log(checkEvenOrOdd(4)); // Should output: Even
console.log(checkEvenOrOdd(7)); // Should output: Odd`
      },
      {
        questionId: evenOddQuestion.id,
        programmingLanguageId: 'python',
        driverCode: `def check_even_or_odd(num):
    # Your code here
    return ""

# Test cases
print(check_even_or_odd(4))  # Should output: Even
print(check_even_or_odd(7))  # Should output: Odd`
      }
    ]
  })

  console.log('🔢 Created Check Even or Odd question')

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
