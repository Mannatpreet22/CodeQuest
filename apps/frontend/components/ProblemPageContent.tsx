'use client'

import { Workspace, Navbar } from '@/components';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { SerializableProblem } from '@/utils/utils/types/serializable';

type ProblemPageContentProps = {
  problem: SerializableProblem;
  pid: string;
}

export default function ProblemPageContent({ problem, pid }: ProblemPageContentProps) {
  return (
    <div className='bg-dark-layer-1 min-h-screen'>
      <Navbar problemPage />
      
      <SignedIn>
        <Workspace problem={problem} pid={pid} />
      </SignedIn>
      
      <SignedOut>
        <div className='flex flex-col items-center justify-center min-h-[calc(100vh-50px)] px-4'>
          <div className='max-w-md w-full bg-dark-layer-2 rounded-lg p-8 text-center'>
            <div className='mb-6'>
              <h1 className='text-2xl font-bold text-white mb-2'>
                Authentication Required
              </h1>
              <p className='text-gray-400'>
                You need to sign in to access coding problems and start solving challenges.
              </p>
            </div>
            
            <div className='space-y-4'>
              <SignInButton mode="modal">
                <button className='w-full bg-brand-orange text-white py-3 px-6 rounded-md font-medium hover:bg-orange-600 transition duration-300'>
                  Sign In to Continue
                </button>
              </SignInButton>
              
              <p className='text-sm text-gray-500'>
                New to CodeQuest? Sign up with the button above!
              </p>
            </div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}