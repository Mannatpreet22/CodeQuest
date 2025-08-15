# Optimus Worker

A Redis-based worker service that processes code submissions using Judge0 for secure code execution.

## Features

- **Judge0 Integration**: Secure code execution using Judge0 API
- **Multi-language Support**: JavaScript, Python, C++
- **Redis Message Queue**: Asynchronous processing of submissions
- **Database Integration**: Stores submission results in PostgreSQL
- **Real-time Results**: Publishes results back through Redis

## Supported Languages

| Language | Judge0 Language ID | Version |
|----------|-------------------|---------|
| JavaScript | 63 | Node.js 12.14.0 |
| Python | 71 | Python 3.8.1 |
| C++ | 54 | GCC 9.2.0 |
| C | 50 | GCC 9.2.0 |

## Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Judge0 Configuration (RapidAPI)
JUDGE0_URL=
JUDGE0_API_KEY=

# Webhook Configuration
WEBHOOK_PORT=3001
WEBHOOK_BASE_URL=http://localhost:3001

# Database Configuration
DATABASE_URL=
```

## Webhook Integration

The worker now supports webhooks for efficient Judge0 integration:

### How Webhooks Work

1. **Submission**: Worker submits code to Judge0 with a `callback_url`
2. **Execution**: Judge0 executes the code asynchronously
3. **Callback**: Judge0 sends results to the webhook endpoint
4. **Processing**: Worker processes the result and updates the database
5. **Next Test Case**: If successful, submits the next test case

### Webhook Endpoint

- **URL**: `POST /webhook/judge0`
- **Port**: 3001 (configurable via `WEBHOOK_BASE_URL`)
- **Health Check**: `GET /health`

### Benefits of Webhooks

- ✅ **No Polling**: No need to continuously check for results
- ✅ **Real-time**: Immediate notification when execution completes
- ✅ **Efficient**: Reduces API calls and improves performance
- ✅ **Scalable**: Better handling of multiple concurrent submissions

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the environment variables above to your `.env` file. The Judge0 API key is already configured for RapidAPI.

### 3. Configure Webhook URL

Make sure your webhook URL is accessible from the internet if you're using a cloud deployment:

```env
WEBHOOK_BASE_URL=https://your-domain.com
```

For local development:
```env
WEBHOOK_BASE_URL=http://localhost:3001
```

### 4. Start the Worker

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The worker will start both the Redis consumer and the webhook server.

### 4. Test Judge0 Connection

You can test if Judge0 is working correctly by making a simple API call:

```bash
curl -X POST https://judge0-extra-ce.p.rapidapi.com/submissions \
  -H "Content-Type: application/json" \
  -H "x-rapidapi-key: " \
  -H "x-rapidapi-host: " \
  -d '{
    "source_code": "print(\"Hello, World!\")",
    "language_id": 71
  }'
```

If successful, you should receive a response with a `token`. You can then check the result:

```bash
curl -X GET https://judge0-extra-ce.p.rapidapi.com/submissions/{token} \
  -H "x-rapidapi-key: " \
  -H "x-rapidapi-host: "
```

## Troubleshooting

### Judge0 Connection Issues

1. **Check API key validity**:
```bash
curl -X GET https://judge0-extra-ce.p.rapidapi.com/about \
  -H "x-rapidapi-key: " \
  -H "x-rapidapi-host: "
```

2. **Verify the API endpoint**:
```bash
curl -X GET https://judge0-extra-ce.p.rapidapi.com/languages \
  -H "x-rapidapi-key: " \
  -H "x-rapidapi-host: "
```

3. **Check rate limits**: RapidAPI has rate limits. If you hit them, you'll get a 429 error.

### Redis Connection Issues

1. **Check Redis connection**:
```bash
redis-cli ping
```

2. **Verify Redis URL in environment**:
```bash
echo $REDIS_URL
```

## How It Works

1. **Message Reception**: Worker listens to Redis queue for new submissions
2. **Code Execution**: Submits code to Judge0 with test case inputs
3. **Result Processing**: Waits for Judge0 to complete execution
4. **Database Storage**: Saves submission results to PostgreSQL
5. **Result Publishing**: Publishes results back through Redis

## API Endpoints

The worker doesn't expose HTTP endpoints directly. It communicates through Redis:

- **Input Queue**: `messages` - Receives submission data
- **Output Channels**: `{submissionId}` - Publishes results

## Submission Format

```json
{
  "userId": "user123",
  "problemId": "problem456",
  "code": "console.log('Hello World');",
  "lang": "javascript",
  "submissionId": "sub789"
}
```

## Result Format

```json
{
  "id": "sub789",
  "status": "AC"
}
```

## Status Codes

- `AC` - Accepted
- `WA` - Wrong Answer
- `TLE` - Time Limit Exceeded
- `RE` - Runtime Error
- `CE` - Compilation Error

## Error Handling

- **Network Errors**: Retries with exponential backoff
- **Judge0 Timeouts**: Returns TLE status
- **Invalid Submissions**: Returns RE status
- **Database Errors**: Logs error but continues processing

## Monitoring

The worker logs all activities with emojis for easy identification:

- ✅ Success operations
- ❌ Error operations
- 📥 Incoming messages
- 📡 Redis connections
- ⚖️ Judge0 operations
- 🛑 Shutdown operations 