'use client'

import { useState, useEffect } from 'react'
import { ProblemsTable, Navbar } from '@/components'
import { BsCheckCircle } from "react-icons/bs"
import { FiSearch, FiFilter, FiShuffle } from "react-icons/fi"
import { BiSort } from "react-icons/bi"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getUserSolvedCount, getTotalQuestionsCount, getRandomProblem, getRandomUnsolvedProblem } from '@/hooks/hooks/getProblemData'
import { toast } from "react-toastify"

export default function HomePageContent() {
  const { user } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [solvedCount, setSolvedCount] = useState(0)
  const [totalProblems, setTotalProblems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [randomLoading, setRandomLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch total problems count
        const total = await getTotalQuestionsCount()
        setTotalProblems(total)

        // Fetch solved count if user is authenticated
        if (user?.id) {
          const solved = await getUserSolvedCount(user.id)
          setSolvedCount(solved)
        } else {
          setSolvedCount(0)
        }
      } catch (error) {
        // Fallback to default values
        setTotalProblems(0)
        setSolvedCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleRandomProblem = async () => {
    if (randomLoading) return
    
    setRandomLoading(true)
    try {
      let randomProblem
      
      if (user?.id) {
        // For authenticated users, try to get an unsolved problem first
        try {
          randomProblem = await getRandomUnsolvedProblem(user.id)
        } catch (error) {
          // If no unsolved problems, fall back to any random problem
          randomProblem = await getRandomProblem()
        }
      } else {
        // For unauthenticated users, get any random problem
        randomProblem = await getRandomProblem()
      }
      
      if (randomProblem && randomProblem.id) {
        router.push(`/problems/${randomProblem.id}`)
      } else {
        toast.error("Failed to get random problem", { 
          position: "top-center", 
          autoClose: 3000, 
          theme: "dark" 
        })
      }
    } catch (error) {
      toast.error("Failed to get random problem", { 
        position: "top-center", 
        autoClose: 3000, 
        theme: "dark" 
      })
    } finally {
      setRandomLoading(false)
    }
  }

  return (
    <div className='bg-dark-layer-2 min-h-screen'>
      <Navbar />
      
      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* Header Section with enhanced styling */}
        <div className='bg-dark-layer-1 rounded-xl p-6 mb-8 border border-dark-divider-border-2 shadow-lg'>
          <div className='flex items-center justify-between'>
            {/* Search Bar with enhanced styling */}
            <div className='flex-1 max-w-md'>
              <div className='relative group'>
                <FiSearch className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-brand-orange transition-colors' />
                <input
                  type='text'
                  placeholder='Search questions'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 bg-dark-fill-3 border border-dark-divider-border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all duration-200'
                />
              </div>
            </div>

            {/* Action Buttons with enhanced styling */}
            <div className='flex items-center space-x-4 ml-8'>
              {/* Progress Indicator with enhanced styling */}
              <div className='flex items-center space-x-4 ml-6'>
                <div className='flex items-center space-x-3 bg-dark-fill-3 rounded-lg px-4 py-2 border border-dark-divider-border-2'>
                  <div className='relative w-10 h-10'>
                    <svg className='w-10 h-10 transform -rotate-90' viewBox='0 0 36 36'>
                      <path
                        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                        fill='none'
                        stroke='#374151'
                        strokeWidth='2'
                      />
                      <path
                        d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                        fill='none'
                        stroke='#FF9F16'
                        strokeWidth='2'
                        strokeDasharray={`${totalProblems > 0 ? (solvedCount / totalProblems) * 100 : 0}, 100`}
                        strokeLinecap='round'
                      />
                    </svg>
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-gray-300 text-sm font-normal'>
                      {loading ? 'Loading...' : `${solvedCount} Solved`}
                    </span>
                    {totalProblems > 0 && (
                      <span className='text-gray-500 text-xs'>
                        of {totalProblems} problems
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleRandomProblem}
                  disabled={randomLoading}
                  className='p-3 bg-dark-fill-3 hover:bg-dark-fill-2 rounded-lg transition-all duration-200 border border-dark-divider-border-2 hover:border-brand-orange/50 group disabled:opacity-50 disabled:cursor-not-allowed'
                  title={user?.id ? "Get a random unsolved problem" : "Get a random problem"}
                >
                  {randomLoading ? (
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-brand-orange'></div>
                  ) : (
                    <FiShuffle className='text-gray-300 group-hover:text-brand-orange transition-colors' />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Problems List with enhanced container */}
        <div className='bg-dark-layer-1 rounded-xl p-6 border border-dark-divider-border-2 shadow-lg'>
          <div className='mb-6'>
            <h2 className='text-white text-3xl font-semibold tracking-tight mb-2'>Problem List</h2>
            <p className='text-gray-300 text-lg leading-relaxed'>Master coding challenges and improve your skills</p>
          </div>
          <div className='space-y-3'>
            <ProblemsTable query={searchQuery} />
          </div>
        </div>
      </div>
    </div>
  )
}