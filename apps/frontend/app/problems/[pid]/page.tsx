'use client';

import { useParams } from 'next/navigation';
import { problems } from '@/utils/utils/problems';
import Workspace from '@/components/components/Workspace/Workspace';
import Navbar from '@/components/components/Navbar/Navbar';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function ProblemPage() {
  const params = useParams();
  const pid = params.pid as string;
  const problem = problems[pid];

  if (!problem) {
    return (
      <div className='bg-dark-layer-1 min-h-screen'>
        <Navbar problemPage />
        <div className='flex items-center justify-center h-screen'>
          <h1 className='text-2xl font-bold text-white'>Problem not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-dark-layer-1 min-h-screen'>
      <Navbar problemPage />
      
      
      <SignedIn>
        <Workspace problem={problem} />
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
