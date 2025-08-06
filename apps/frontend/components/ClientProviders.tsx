'use client'

import { ClerkProvider } from '@clerk/nextjs'
import useHasMounted from '@/hooks/hooks/useHasMounted'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    // Return a loading state or the children without Clerk during SSR
    return <>{children}</>
  }

  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}