import axios from 'axios';

// API base URL - can be moved to environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types for API responses based on the Prisma schema
interface Question {
    id: string;
    title: string;
    body: string;
    createdAt?: string;
    updatedAt?: string;
}

interface TestCase {
    id: number;
    inputs: any;
    expected: any;
    isVisible: boolean;
    questionId: string;
    createdAt?: string;
    updatedAt?: string;
    testCaseInputs: TestCaseInput[];
}

interface TestCaseInput {
    id: number;
    testCaseId: number;
    position: number;
    name: string | null;
    value: any;
}

interface QuestionWithTestCases extends Question {
    testcases: TestCase[];
}

interface TemplateCode {
    id: string;
    questionId: string;
    programmingLanguageId: string;
    driverCode: string;
}

// Submission types
interface CodeSubmission {
    problemId: string;
    userId: string;
    code: string;
    lang: string;
}

interface SubmissionResponse {
    success: boolean;
    data?: any;
    message: string;
    errors?: any[];
}

// Get all questions from the database
export const getAllQuestions = async (): Promise<Question[] | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/all-questions`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch all questions');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching all questions:', error);
        return null;
    }
};

// Get a specific problem by ID (basic info only)
export const getProblemDescription = async (pid: string): Promise<Question | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/question`, {
            params: { id: pid }
        });
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch problem description');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching problem description:', error);
        return null;
    }
};

// Get problem with visible test cases (for users)
export const getProblemWithTestCases = async (pid: string): Promise<QuestionWithTestCases | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/question/${pid}/testcases`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch problem with test cases');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching problem with test cases:', error);
        return null;
    }
};

// Get problem with ALL test cases (for submission/evaluation - admin use)
export const getProblemWithAllTestCases = async (pid: string): Promise<QuestionWithTestCases | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/question/${pid}/all-testcases`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch problem with all test cases');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching problem with all test cases:', error);
        return null;
    }
};

// Get template code for a specific problem and language
export const getTemplateCode = async (pid: string, language: string): Promise<TemplateCode | null> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/template/${pid}/${language}`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch template code');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching template code:', error);
        return null;
    }
};

// Run code (test execution - doesn't save to database)
export const runCode = async (submission: CodeSubmission): Promise<SubmissionResponse> => {
    try {
        // Set timeout to 30 seconds for code execution
        const response = await axios.post(`${API_BASE_URL}/api/submit/run`, submission, {
            timeout: 30000 // 30 seconds timeout
        });
        
        return response.data;
    } catch (error: any) {
        console.error('Error running code:', error);
        
        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return {
                success: false,
                message: 'Server is busy or down. Please try again later.',
                errors: ['TIMEOUT']
            };
        }
        
        // Check if it's a network error
        if (!error.response) {
            return {
                success: false,
                message: 'Server is down or unreachable. Please check your connection and try again.',
                errors: ['NETWORK_ERROR']
            };
        }
        
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to run code',
            errors: error.response?.data?.errors
        };
    }
};

// Submit code (saves to database)
export const submitCode = async (submission: CodeSubmission): Promise<SubmissionResponse> => {
    try {
        // Set timeout to 30 seconds for code submission
        const response = await axios.post(`${API_BASE_URL}/api/submit/submit`, submission, {
            timeout: 30000 // 30 seconds timeout
        });
        
        return response.data;
    } catch (error: any) {
        console.error('Error submitting code:', error);
        
        // Check if it's a timeout error
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return {
                success: false,
                message: 'Server is busy or down. Please try again later.',
                errors: ['TIMEOUT']
            };
        }
        
        // Check if it's a network error
        if (!error.response) {
            return {
                success: false,
                message: 'Server is down or unreachable. Please check your connection and try again.',
                errors: ['NETWORK_ERROR']
            };
        }
        
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to submit code',
            errors: error.response?.data?.errors
        };
    }
};

// Get submission status
export const getSubmissionStatus = async (submissionId: string): Promise<SubmissionResponse> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/submit/submission/${submissionId}`);
        
        return response.data;
    } catch (error: any) {
        console.error('Error fetching submission status:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch submission status'
        };
    }
};

// Get all submissions for a user
export const getUserSubmissions = async (userId: string): Promise<SubmissionResponse> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/submit/submissions/${userId}`);
        
        return response.data;
    } catch (error: any) {
        console.error('Error fetching user submissions:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch user submissions'
        };
    }
};

// Legacy function for backward compatibility - now uses the visible test cases endpoint
export const getProblemTestCases = async (pid: string): Promise<QuestionWithTestCases | null> => {
    return getProblemWithTestCases(pid);
};