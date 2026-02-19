'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Mail, Lock, User, Gift, ChevronDown, ChevronUp } from 'lucide-react'
import { validateEmail, validatePassword, validateNickname, validateReferralCode } from '@/utils/validation'
import { ROUTES, POINTS } from '@/utils/constants'
import { generateReferralCode } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { OAuthButtons } from '@/components/features/auth/OAuthButtons'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: '',
    referralCode: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const oauthError = searchParams.get('error')

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nicknameValidation = validateNickname(formData.nickname)
    const emailValidation = validateEmail(formData.email)
    const passwordValidation = validatePassword(formData.password)
    const referralValidation = validateReferralCode(formData.referralCode)

    const newErrors: Record<string, string> = {}

    if (!nicknameValidation.isValid) {
      newErrors.nickname = nicknameValidation.error!
    }
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error!
    }
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error!
    }
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    }
    if (!referralValidation.isValid) {
      newErrors.referralCode = referralValidation.error!
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      let referrer: { id: string; points: number } | null = null

      if (formData.referralCode) {
        const { data: refUser } = await (supabase.from('users') as any)
          .select('id, points')
          .eq('referral_code', formData.referralCode)
          .maybeSingle()

        if (!refUser) {
          setErrors({ referralCode: '유효하지 않은 추천인 코드입니다.' })
          return
        }
        referrer = refUser as { id: string; points: number }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })
      if (authError) {
        setErrors({ email: authError.message })
        return
      }

      if (!authData.user) {
        setErrors({ email: '회원가입 후 이메일 인증을 완료해주세요.' })
        return
      }

      const signupPoints =
        POINTS.SIGNUP_BONUS + (referrer ? POINTS.REFERRAL_BONUS : 0)

      const profilePayload = {
        id: authData.user.id,
        email: formData.email,
        nickname: formData.nickname,
        avatar_url: null,
        points: signupPoints,
        referral_code: generateReferralCode(),
        referred_by: formData.referralCode || null,
        tier: 'BRONZE',
        total_sales: 0,
        total_purchases: 0,
      }
      const { error: profileError } = await (supabase.from('users') as any).upsert(
        profilePayload
      )

      if (profileError) {
        setErrors({ email: '회원 프로필 생성에 실패했습니다. 다시 시도해주세요.' })
        return
      }

      if (referrer) {
        await (supabase.from('users') as any)
          .update({
            points: referrer.points + POINTS.REFERRAL_BONUS,
            updated_at: new Date().toISOString(),
          })
          .eq('id', referrer.id)
      }

      router.replace(ROUTES.HOME)
      router.refresh()
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({ email: '회원가입에 실패했습니다. 다시 시도해주세요.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">회원가입</CardTitle>
        <CardDescription className="text-center">
          지금 가입하고 100 포인트를 받으세요!
        </CardDescription>

        <div className="bg-gradient-to-r from-violet-50 to-cyan-50 rounded-lg p-3 border border-primary/20 mt-4">
          <div className="flex items-center justify-center space-x-2">
            <Gift className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-gray-800">
              가입 즉시{' '}
              <Badge variant="secondary" className="bg-primary text-white">
                {POINTS.SIGNUP_BONUS} F
              </Badge>{' '}
              지급!
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {oauthError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">
            소셜 로그인에 실패했습니다. 다시 시도해주세요.
          </p>
        )}

        <OAuthButtons />

        {/* 이메일 가입 토글 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => setShowEmailForm(!showEmailForm)}
        >
          이메일로 가입하기
          {showEmailForm ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>

        {showEmailForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium text-gray-700">
                닉네임
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="nickname"
                  type="text"
                  placeholder="홍길동123"
                  value={formData.nickname}
                  onChange={(e) => handleChange('nickname', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.nickname && (
                <p className="text-sm text-red-600">{errors.nickname}</p>
              )}
              <p className="text-xs text-gray-500">
                2-20자, 한글/영문/숫자/언더스코어만 사용 가능
              </p>
            </div>

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
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
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
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500">최소 8자 이상</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="••••••••"
                  value={formData.passwordConfirm}
                  onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.passwordConfirm && (
                <p className="text-sm text-red-600">{errors.passwordConfirm}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                추천인 코드 <span className="text-gray-500 font-normal">(선택)</span>
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="ABC12345"
                  value={formData.referralCode}
                  onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
                  className="pl-10 uppercase"
                  disabled={isLoading}
                  maxLength={8}
                />
              </div>
              {errors.referralCode && (
                <p className="text-sm text-red-600">{errors.referralCode}</p>
              )}
              <p className="text-xs text-gray-500">
                추천인 코드 입력 시 추가 {POINTS.REFERRAL_BONUS} 포인트 지급
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? '가입 중...' : '가입하고 100 포인트 받기'}
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
            로그인
          </Link>
        </div>

        <p className="text-xs text-center text-gray-500">
          가입 시{' '}
          <Link href="/terms" className="underline">이용약관</Link>
          {' '}및{' '}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
