'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types/database'

interface AuthProviderProps {
  serverUser: User | null
  children: React.ReactNode
}

export function AuthProvider({ serverUser, children }: AuthProviderProps) {
  const { setUser, reset } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      setUser(serverUser)
      initialized.current = true
    }
  }, [serverUser, setUser])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        reset()
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (!session?.user) {
          reset()
          return
        }

        const { data } = await (supabase.from('users') as any)
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        setUser(data ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, reset])

  return <>{children}</>
}
