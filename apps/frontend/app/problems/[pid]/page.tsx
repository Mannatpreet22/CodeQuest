import type { Metadata } from 'next'
import { notFound } from 'next/navigation';
import ProblemPageContent from '@/components/ProblemPageContent';
import { getProblemDescription } from '@/hooks/hooks/getProblemData';

type Props = {
  params: Promise<{ pid: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pid } = await params;
  
  try {
    const problem = await getProblemDescription(pid);
    
    if (!problem) {
      return {
        title: 'Problem Not Found | CodeQuest',
        description: 'The requested coding problem could not be found.'
      }
    }
    
    return {
      title: `${problem.title} | CodeQuest`,
      description: `Solve the ${problem.title} coding problem on CodeQuest. Practice your programming skills with this challenging problem.`,
    }
  } catch (error) {
    return {
      title: 'Problem Not Found | CodeQuest',
      description: 'The requested coding problem could not be found.'
    }
  }
}

export default async function ProblemPage({ params }: Props) {
  const { pid } = await params;
  
  try {
    const problem = await getProblemDescription(pid);

    if (!problem) {
      notFound();
    }

    // Create a serializable problem object that matches the expected interface
    const serializableProblem = {
      id: problem.id,
      title: problem.title,
      problemStatement: problem.body, // Map 'body' to 'problemStatement'
      examples: [], // Will be loaded by the ProblemDescription component from database
      constraints: "Constraints will be loaded from database", // Placeholder
      order: 1, // Mock order
      starterCode: "// Your code here", // Mock starter code
      starterFunctionName: "solution" // Mock function name
    };

    return <ProblemPageContent problem={serializableProblem} pid={pid} />
  } catch (error) {
    console.error('Error loading problem:', error);
    notFound();
  }
}
