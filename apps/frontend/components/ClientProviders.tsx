'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { Suspense } from 'react'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#ff8c00', // brand-orange color
        },
      }}
    >
      <Suspense fallback={<div className="min-h-screen bg-dark-layer-1 flex items-center justify-center">Loading...</div>}>
        {children}
      </Suspense>
    </ClerkProvider>
  )
}