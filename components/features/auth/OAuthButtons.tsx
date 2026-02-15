'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils/constants'

interface OAuthButtonsProps {
  mode: 'login' | 'signup'
}

export function OAuthButtons({ mode }: OAuthButtonsProps) {
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
              ? {
                  access_type: 'offline',
                  prompt: 'consent',
                }
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

  const actionText = mode === 'login' ? '로그인' : '시작하기'

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">또는 소셜 계정으로 {actionText}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => startOAuth('google')}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'google' ? 'Google 연결 중...' : 'Google로 계속하기'}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full border-[#FEE500] bg-[#FEE500] text-black hover:bg-[#f8dd00]"
        onClick={() => startOAuth('kakao')}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'kakao' ? 'Kakao 연결 중...' : 'Kakao로 계속하기'}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
