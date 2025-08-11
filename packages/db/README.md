# Database Package

This package contains the database schema, migrations, and seeding scripts for the CodeQuest application.

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Generate Prisma client**:
```bash
npx prisma generate
```

3. **Run migrations**:
```bash
npx prisma migrate dev
```

## Seeding the Database

The seed script will populate the database with sample questions and test cases.

### Option 1: Using the seed script directly
```bash
npm run seed
```

### Option 2: Using the root script
From the project root directory:
```bash
./seed-db.sh
```

## What gets seeded?

The seed script creates:

- **4 Programming Questions**:
  1. **Sum of Two Numbers** - Basic arithmetic
  2. **Find Maximum Number** - Array operations
  3. **Reverse String** - String manipulation
  4. **Check Even or Odd** - Conditional logic

Each question includes:
- Multiple test cases with various inputs
- Example inputs and outputs with explanations
- Template code for JavaScript, Python, and C++

## Database Schema

The database includes the following models:
- `User` - Application users
- `Question` - Programming problems
- `TestCase` - Test cases for questions
- `TestCaseInput` - Individual input parameters
- `Example` - Example inputs and outputs
- `TemplateCode` - Starter code templates
- `Submission` - User code submissions

## Environment Variables

Make sure you have the following environment variables set:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
``` 