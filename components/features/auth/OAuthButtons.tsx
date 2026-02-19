'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils/constants'

export function OAuthButtons() {
  const router = useRouter()
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'kakao' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startOAuth = async (provider: 'google' | 'kakao') => {
    setError(null)
    setLoadingProvider(provider)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${ROUTES.AUTH_CALLBACK}`,
          queryParams:
            provider === 'google'
              ? { access_type: 'offline', prompt: 'consent' }
              : undefined,
        },
      })

      if (oauthError) {
        setError(`${provider === 'google' ? 'Google' : 'Kakao'} 로그인에 실패했습니다.`)
        setLoadingProvider(null)
      }
    } catch (e) {
      console.error('OAuth error:', e)
      setError('소셜 로그인 처리 중 오류가 발생했습니다.')
      setLoadingProvider(null)
    } finally {
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3 font-medium"
        onClick={() => startOAuth('google')}
        disabled={loadingProvider !== null}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loadingProvider === 'google' ? 'Google 연결 중...' : 'Google로 계속하기'}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3 font-medium border-[#FEE500] bg-[#FEE500] text-[#191919] hover:bg-[#f0d800] hover:border-[#f0d800]"
        onClick={() => startOAuth('kakao')}
        disabled={loadingProvider !== null}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
          <path d="M12 3C6.48 3 2 6.36 2 10.41c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.1a.32.32 0 0 0 .48.34l4.66-3.08c.52.07 1.05.1 1.6.1 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
        </svg>
        {loadingProvider === 'kakao' ? 'Kakao 연결 중...' : 'Kakao로 계속하기'}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
