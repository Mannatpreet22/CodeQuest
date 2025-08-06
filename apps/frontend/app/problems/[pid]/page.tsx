import type { Metadata } from 'next'
import { problems } from '@/utils/utils/problems';
import { notFound } from 'next/navigation';
import { serializeProblem } from '@/utils/utils/types/serializable';
import ProblemPageContent from '@/components/ProblemPageContent';

type Props = {
  params: Promise<{ pid: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pid } = await params;
  const problem = problems[pid];
  
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
}

export default async function ProblemPage({ params }: Props) {
  const { pid } = await params;
  const problem = problems[pid];

  if (!problem) {
    notFound();
  }

  // Create a serializable version of the problem without functions
  const serializableProblem = serializeProblem(problem);

  return <ProblemPageContent problem={serializableProblem} pid={pid} />;
}
