# CodeQuest Backend Architecture

A microservices-based backend for a competitive programming platform with real-time code execution using Judge0.

## 🏗️ Architecture Overview

https://drive.google.com/file/d/1-mAfm4Cl8BIpkyzYAnvEJPvbZowYyJmT/view

## 🔄 Request Flow

1. **User submits code** → API endpoint (`/api/submit/submit`)
2. **API validates** → Request and sends to Redis queue
3. **Worker picks up** → Message from Redis queue
4. **Worker processes** → Fetches test cases from database
5. **Worker submits** → Code to Judge0 API
6. **Judge0 executes** → Code against test cases
7. **Worker receives** → Results from Judge0
8. **Worker saves** → Results to database
9. **Worker publishes** → Results via Redis pub/sub
10. **API receives** → Results and sends to user

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- npm

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
# Generate Prisma client
cd packages/db && npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npm run seed
```

### 3. Configure Environment

Create `.env` files in each service:

**apps/api/.env:**
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/codequest
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=
```

**apps/optimus-worker/.env:**
```env
NODE_ENV=development
REDIS_URL=redis://localhost:6379
JUDGE0_URL=https://judge0-extra-ce.p.rapidapi.com
JUDGE0_API_KEY=
DATABASE_URL=postgresql://username:password@localhost:5432/codequest
```

### 4. Start All Services

```bash
# Use the startup script
./start-backend.sh

# Or start manually:
# Terminal 1: API Server
cd apps/api && npm run dev

# Terminal 2: Worker
cd apps/optimus-worker && npm run dev
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Service health status

### Code Execution
- `POST /api/submit/run` - Test code execution (no database save)
- `POST /api/submit/submit` - Submit code for evaluation

### Submissions
- `GET /api/submit/submission/:id` - Get submission status
- `GET /api/submit/submissions/:userId` - Get user submissions
- `GET /api/submit/all-submissions` - Get all submissions (admin)

### Request Format

```json
{
  "userId": "user123",
  "problemId": "976d3daf-8aa8-48ae-9ca7-f5098b3485b4",
  "code": "def add_two_numbers(a, b):\n    return a + b\n\na, b = map(int, input().split())\nprint(add_two_numbers(a, b))",
  "lang": "python"
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "submission123",
    "status": "AC"
  },
  "message": "Submission created successfully"
}
```

## 🧪 Testing

### Integration Test

```bash
# Run the complete integration test
node test-integration.js
```

### Individual Service Tests

```bash
# Test Judge0 connection
cd judge0-test && npm run test-free

# Test API endpoints
curl http://localhost:3000/health
```

## 🔧 Services

### 1. API Server (`apps/api`)
- **Port**: 3000
- **Purpose**: HTTP API endpoints, request validation, Redis pub/sub
- **Tech**: Express.js, Prisma, Redis

### 2. Optimus Worker (`apps/optimus-worker`)
- **Purpose**: Background job processing, Judge0 integration
- **Tech**: Node.js, Judge0 API, Redis, Prisma

### 3. Database (`packages/db`)
- **Purpose**: Data persistence, migrations, seeding
- **Tech**: PostgreSQL, Prisma

### 4. Redis (`packages/redis`)
- **Purpose**: Message queue, pub/sub communication
- **Tech**: Redis, Node.js

## 📊 Monitoring

### Health Checks
- API: `http://localhost:3000/health`
- Worker: Logs in console

### Logs
- API Server: Console output
- Worker: Console output with emojis for easy identification

### Database
- Use Prisma Studio: `npx prisma studio`

## 🚨 Error Handling

- **API Errors**: Proper HTTP status codes and error messages
- **Worker Errors**: Graceful error handling with retries
- **Judge0 Errors**: Timeout handling and status mapping
- **Database Errors**: Transaction rollback and error logging

## 🔒 Security

- Rate limiting on API endpoints
- Input validation with Zod schemas
- Environment variable configuration
- No sensitive data in logs

## 📈 Performance

- Asynchronous processing with Redis queues
- Efficient Judge0 integration with polling
- Database connection pooling
- Optimized test case processing

## 🛠️ Development

### Adding New Languages

1. Update `Judge0Service.getLanguageId()` in worker
2. Add language to supported languages list
3. Test with Judge0 API

### Adding New Endpoints

1. Create route in appropriate router
2. Add validation with Zod schemas
3. Update API documentation

### Database Changes

1. Update Prisma schema
2. Generate migration: `npx prisma migrate dev`
3. Update affected services

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure Judge0 API limits
- [ ] Set up monitoring and logging
- [ ] Configure load balancing
- [ ] Set up SSL certificates

### Docker Support

```bash
# Build images
docker build -t codequest-api apps/api
docker build -t codequest-worker apps/optimus-worker

# Run with docker-compose
docker-compose up -d
```

## 📝 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify connection settings

2. **Judge0 API Errors**
   - Check API key validity
   - Verify rate limits

3. **Database Connection Issues**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format

4. **Worker Not Processing**
   - Check Redis queue has messages
   - Verify worker is connected to Redis

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages

## 📄 License

This project is licensed under the MIT License. 
