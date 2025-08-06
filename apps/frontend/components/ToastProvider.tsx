'use client'

import { ToastContainer } from 'react-toastify'
import useHasMounted from '@/hooks/hooks/useHasMounted'

export default function ToastProvider() {
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    return null
  }

  return <ToastContainer />
}