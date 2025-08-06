/**
 * Modern localStorage utility with type safety and error handling
 */

export class LocalStorage {
  private static isClient = typeof window !== 'undefined';

  static get<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): boolean {
    if (!this.isClient) return false;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  }

  static remove(key: string): boolean {
    if (!this.isClient) return false;
    
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  }

  static clear(): boolean {
    if (!this.isClient) return false;
    
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }
}

// Specific storage keys for the app
export const STORAGE_KEYS = {
  SOLVED_PROBLEMS: 'solvedProblems',
  USER_CODE: (pid: string) => `code-${pid}`,
  USER_DATA: 'user',
  PROBLEM_DATA: (pid: string) => `problem_${pid}`,
  SETTINGS: 'settings',
} as const;

// Type-safe storage functions for common use cases
export const StorageService = {
  getSolvedProblems: (): string[] => 
    LocalStorage.get(STORAGE_KEYS.SOLVED_PROBLEMS, []),
  
  setSolvedProblems: (problems: string[]): boolean => 
    LocalStorage.set(STORAGE_KEYS.SOLVED_PROBLEMS, problems),
  
  addSolvedProblem: (pid: string): boolean => {
    const solved = StorageService.getSolvedProblems();
    if (!solved.includes(pid)) {
      solved.push(pid);
      return StorageService.setSolvedProblems(solved);
    }
    return true;
  },
  
  getUserCode: (pid: string): string | null => 
    LocalStorage.get(STORAGE_KEYS.USER_CODE(pid), null),
  
  setUserCode: (pid: string, code: string): boolean => 
    LocalStorage.set(STORAGE_KEYS.USER_CODE(pid), code),
  
  getProblemData: (pid: string) => 
    LocalStorage.get(STORAGE_KEYS.PROBLEM_DATA(pid), { likes: 0, dislikes: 0 }),
  
  setProblemData: (pid: string, data: any): boolean => 
    LocalStorage.set(STORAGE_KEYS.PROBLEM_DATA(pid), data),
};