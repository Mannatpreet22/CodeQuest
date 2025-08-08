import axios from 'axios';

// API base URL - can be moved to environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

// Types for API responses based on the Prisma schema
interface Example {
    id: number;
    inputData: string;
    outputData: string;
    explanation?: string;
    questionId: string;
}

interface Question {
    id: string;
    title: string;
    body: string;
    createdAt?: string;
    updatedAt?: string;
    examples?: Example[];
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
    examples: Example[];
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
        console.log('Fetching questions from:', `${API_BASE_URL}/api/questions/all-questions`); // Debug log
        const response = await axios.get(`${API_BASE_URL}/api/questions/all-questions`);
        
        console.log('API Response status:', response.status); // Debug log
        console.log('API Response data:', response.data); // Debug log
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch all questions');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching all questions:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            response: (error as any)?.response?.data,
            status: (error as any)?.response?.status,
            config: (error as any)?.config
        });
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
        // Set timeout to 10 seconds for code execution
        const response = await axios.post(`${API_BASE_URL}/api/submit/run`, submission, {
            timeout: 10000 // 10 seconds timeout
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
        // Set timeout to 10 seconds for code submission
        const response = await axios.post(`${API_BASE_URL}/api/submit/submit`, submission, {
            timeout: 10000 // 10 seconds timeout
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

// Get submissions for a specific problem by a user
export const getUserProblemSubmissions = async (userId: string, problemId: string): Promise<SubmissionResponse> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/submit/submissions/${userId}/${problemId}`);
        
        return response.data;
    } catch (error: any) {
        console.error('Error fetching user problem submissions:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch user problem submissions'
        };
    }
};

// Legacy function for backward compatibility - now uses the visible test cases endpoint
export const getProblemTestCases = async (pid: string): Promise<QuestionWithTestCases | null> => {
    return getProblemWithTestCases(pid);
};

// Get user interaction for a specific question
export const getUserInteraction = async (questionId: string, userId: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/question/${questionId}/interaction`, {
            params: { userId }
        });
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch user interaction');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching user interaction:', error);
        return { liked: false, disliked: false, starred: false };
    }
};

// Get question stats (likes, dislikes, stars)
export const getQuestionStats = async (questionId: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/question/${questionId}/stats`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch question stats');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching question stats:', error);
        return { likes: 0, dislikes: 0, stars: 0 };
    }
};

// Toggle like for a question
export const toggleLike = async (questionId: string, userId: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/questions/question/${questionId}/like`, {
            userId
        });
        
        if (response.status !== 200) {
            throw new Error('Failed to toggle like');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
};

// Toggle dislike for a question
export const toggleDislike = async (questionId: string, userId: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/questions/question/${questionId}/dislike`, {
            userId
        });
        
        if (response.status !== 200) {
            throw new Error('Failed to toggle dislike');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error toggling dislike:', error);
        throw error;
    }
};

// Toggle star for a question
export const toggleStar = async (questionId: string, userId: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/questions/question/${questionId}/star`, {
            userId
        });
        
        if (response.status !== 200) {
            throw new Error('Failed to toggle star');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error toggling star:', error);
        throw error;
    }
};

// Get count of problems solved by a user
export const getUserSolvedCount = async (userId: string): Promise<number> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/user/${userId}/solved-count`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch solved count');
        }
        
        return response.data.solvedCount;
    } catch (error) {
        console.error('Error fetching solved count:', error);
        return 0;
    }
};

// Get total number of questions
export const getTotalQuestionsCount = async (): Promise<number> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/total-count`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch total count');
        }
        
        return response.data.totalCount;
    } catch (error) {
        console.error('Error fetching total count:', error);
        return 0;
    }
};

// Get a random problem
export const getRandomProblem = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/random`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch random problem');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching random problem:', error);
        throw error;
    }
};

// Get a random unsolved problem for a user
export const getRandomUnsolvedProblem = async (userId: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/questions/random/unsolved/${userId}`);
        
        if (response.status !== 200) {
            throw new Error('Failed to fetch random unsolved problem');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error fetching random unsolved problem:', error);
        throw error;
    }
};