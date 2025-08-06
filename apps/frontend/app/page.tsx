import type { Metadata } from 'next'
import HomePageContent from '@/components/HomePageContent'

export const metadata: Metadata = {
  title: 'Practice Problems',
  description: 'Browse and solve coding problems to improve your programming skills. Quality over quantity approach to mastering algorithms and data structures.',
}

export default function Home() {
  return <HomePageContent />
}