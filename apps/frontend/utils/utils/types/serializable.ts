import { Problem } from './problem';

/**
 * Serializable version of Problem type without functions
 * Used for passing problem data from server to client components
 */
export type SerializableProblem = Omit<Problem, 'handlerFunction'>;

/**
 * Helper function to convert a Problem to SerializableProblem
 */
export function serializeProblem(problem: Problem): SerializableProblem {
  return {
    id: problem.id,
    title: problem.title,
    problemStatement: problem.problemStatement,
    examples: problem.examples,
    constraints: problem.constraints,
    order: problem.order,
    starterCode: problem.starterCode,
    starterFunctionName: problem.starterFunctionName,
  };
}