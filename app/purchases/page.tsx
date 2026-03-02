'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PurchasesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/profile?tab=purchased')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
