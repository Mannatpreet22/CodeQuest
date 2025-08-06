import { type Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ToastProvider } from '@/components'
import ClientProviders from '@/components/ClientProviders'
import 'react-toastify/dist/ReactToastify.css'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CodeQuest - Master Coding Through Practice',
    template: '%s | CodeQuest'
  },
  description: 'CodeQuest is a modern platform for learning and practicing coding problems. Master algorithms, data structures, and problem-solving skills.',
  keywords: ['coding', 'programming', 'algorithms', 'data structures', 'interview prep', 'leetcode', 'practice'],
  authors: [{ name: 'CodeQuest Team' }],
  creator: 'CodeQuest',
  metadataBase: new URL('https://codequest.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://codequest.dev',
    title: 'CodeQuest - Master Coding Through Practice',
    description: 'Practice coding problems and master algorithms with CodeQuest.',
    siteName: 'CodeQuest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeQuest - Master Coding Through Practice',
    description: 'Practice coding problems and master algorithms with CodeQuest.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientProviders>
          {children}
          <ToastProvider />
        </ClientProviders>
      </body>
    </html>
  )
}