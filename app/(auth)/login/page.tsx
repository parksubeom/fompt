'use client'

/**
 * Login Page
 * 로그인 폼
 */

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, Mail, Lock } from 'lucide-react'
import { validateEmail, validatePassword } from '@/utils/validation'
import { ROUTES } from '@/utils/constants'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검증
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
      // TODO: Supabase 로그인 로직 구현
      console.log('Login:', { email, password })
      
      // 임시: 2초 후 홈으로 이동
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push(ROUTES.HOME)
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ email: '로그인에 실패했습니다. 다시 시도해주세요.' })
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

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* 이메일 입력 */}
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

          {/* 비밀번호 입력 */}
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

          {/* 비밀번호 찾기 (추후 구현) */}
          <div className="flex justify-end">
            <Link
              href="/auth/reset-password"
              className="text-sm text-primary hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            아직 계정이 없으신가요?{' '}
            <Link href={ROUTES.SIGNUP} className="text-primary font-medium hover:underline">
              회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
