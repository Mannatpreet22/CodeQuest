'use client';

import { problems } from '@/mockProblems/problem'
import ProblemsTable from '@/components/components/ProblemsTable/ProblemsTable'
import Navbar from '@/components/components/Navbar/Navbar'

export default function Home() {
  return (
    <div className='bg-dark-layer-1 min-h-screen'>
      <Navbar />
      <h1 className='text-2xl font-bold text-center text-gray-700 dark:text-gray-400 uppercase mt-10 mb-5'>
        &ldquo; QUALITY OVER QUANTITY &rdquo; 👇
      </h1>
      <div className='relative overflow-x-auto mx-auto px-6 pb-10'>
        <table className='text-sm text-left text-gray-500 dark:text-gray-400 sm:w-7/12 w-full max-w-[1200px] mx-auto'>
          <thead className='text-xs text-gray-700 uppercase dark:text-gray-400 border-b '>
            <tr>
              <th scope='col' className='px-1 py-3 w-0 font-medium'>
                Status
              </th>
              <th scope='col' className='px-6 py-3 w-0 font-medium'>
                Title
              </th>
              <th scope='col' className='px-6 py-3 w-0 font-medium'>
                Difficulty
              </th>
              <th scope='col' className='px-6 py-3 w-0 font-medium'>
                Category
              </th>
              <th scope='col' className='px-6 py-3 w-0 font-medium'>
                Solution
              </th>
            </tr>
          </thead>
          <ProblemsTable setLoadingProblems={() => {}} />
        </table>
      </div>
    </div>
  )
}