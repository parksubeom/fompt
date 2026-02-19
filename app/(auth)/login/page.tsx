'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, Mail, Lock } from 'lucide-react'
import { validateEmail, validatePassword } from '@/utils/validation'
import { ROUTES } from '@/utils/constants'
import { supabase } from '@/lib/supabase'
import { OAuthButtons } from '@/components/features/auth/OAuthButtons'

const OAUTH_ERROR_MAP: Record<string, string> = {
  'oauth-code-missing': '소셜 로그인 인증 코드를 받지 못했습니다. 다시 시도해주세요.',
  'oauth-exchange-failed': '소셜 로그인 세션 교환에 실패했습니다. 다시 시도해주세요.',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const oauthError = searchParams.get('error')
  const oauthErrorMessage = oauthError ? OAUTH_ERROR_MAP[oauthError] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setErrors({
        email: emailValidation.error,
        password: passwordValidation.error,
      })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setErrors({ form: '이메일 또는 비밀번호를 확인해주세요.' })
        return
      }

      const redirectTo = searchParams.get('redirect') || ROUTES.HOME
      router.replace(redirectTo)
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ form: '로그인에 실패했습니다. 다시 시도해주세요.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center">
            <LogIn className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">로그인</CardTitle>
        <CardDescription className="text-center">
          FOMPT 계정으로 로그인하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {oauthErrorMessage && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{oauthErrorMessage}</p>
        )}

        <OAuthButtons />

        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">또는 이메일로 로그인</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <p className="text-sm text-red-600">{errors.form}</p>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              href="/auth/reset-password"
              className="text-sm text-primary hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '이메일로 로그인'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          아직 계정이 없으신가요?{' '}
          <Link href={ROUTES.SIGNUP} className="text-primary font-medium hover:underline">
            회원가입
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
