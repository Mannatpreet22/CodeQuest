// Test script to send a message to Redis for the worker to process
const { createClient } = require('@redis/client');

async function testWorker() {
    // Create Redis client
    const redisClient = createClient({
        url: 'redis://localhost:6379'
    });

    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis');

        // Test submission data
        const testSubmission = {
            userId: "test-user-123",
            problemId: "7bfbbddd-63c4-484a-b849-6d3cc44dbc51", // Two Sum problem ID from seed
            code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Create an unordered_map to store complements
        unordered_map<int, int> seen;
        
        // Iterate through the array
        for (int i = 0; i < nums.size(); i++) {
            int num = nums[i];
            int complement = target - num;
            
            // If complement exists in hash map, we found our pair
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            
            // Store current number and its index
            seen[num] = i;
        }
        
        // No solution found
        return {};
    }
};`,
            lang: "cpp",
            submissionId: "test-submission-" + Date.now()
        };

        console.log('📤 Sending test submission to Redis...');
        console.log('🔍 Submission ID:', testSubmission.submissionId);
        console.log('🔍 Problem ID:', testSubmission.problemId);
        console.log('🔍 Language:', testSubmission.lang);

        // Send message to Redis queue
        await redisClient.lPush('messages', JSON.stringify(testSubmission));
        console.log('✅ Message sent to Redis queue');

        // Wait a bit for the worker to process
        console.log('⏳ Waiting for worker to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('✅ Test completed!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await redisClient.disconnect();
        console.log('🔌 Disconnected from Redis');
    }
}

// Run the test
testWorker(); 