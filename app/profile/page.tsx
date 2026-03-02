'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User,
  Mail,
  Copy,
  Check,
  ShoppingBag,
  Plus,
  TrendingUp,
  Package,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { TIERS, ROUTES, CATEGORIES } from '@/utils/constants'
import {
  formatPoints,
  formatRelativeTime,
  formatCompactNumber,
} from '@/utils/format'
import type { Prompt } from '@/types/database'

type Tab = 'selling' | 'purchased'

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuthStore()
  const initialTab = (searchParams.get('tab') as Tab) || 'selling'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([])
  const [purchasedPrompts, setPurchasedPrompts] = useState<
    (Prompt & { price_paid: number })[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchMyPrompts = useCallback(async () => {
    if (!user) return
    const { data } = await (supabase.from('prompts') as any)
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    setMyPrompts((data ?? []) as Prompt[])
  }, [user])

  const fetchPurchasedPrompts = useCallback(async () => {
    if (!user) return
    const { data } = await (supabase.from('purchases') as any)
      .select('price_paid, prompt:prompts!prompt_id(*)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    const mapped = (data ?? []).map((row: any) => ({
      ...row.prompt,
      price_paid: row.price_paid,
    }))
    setPurchasedPrompts(mapped)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`${ROUTES.LOGIN}?redirect=/profile`)
      return
    }

    setIsLoading(true)
    Promise.all([fetchMyPrompts(), fetchPurchasedPrompts()]).finally(() =>
      setIsLoading(false)
    )
  }, [user, authLoading, router, fetchMyPrompts, fetchPurchasedPrompts])

  const handleCopyReferral = async () => {
    if (!user?.referral_code) return
    await navigator.clipboard.writeText(user.referral_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const tierInfo = TIERS[user.tier]
  const totalTransactions = user.total_sales + user.total_purchases

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* 프로필 헤더 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.avatar_url || undefined}
                alt={user.nickname}
              />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                {user.nickname[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-2">
                <h1 className="text-2xl font-bold">{user.nickname}</h1>
                <Badge
                  variant="outline"
                  className={`${tierInfo.colorClass}`}
                >
                  {tierInfo.badge} {tierInfo.label}
                </Badge>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500 mb-4">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-violet-50 to-cyan-50">
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
                    {formatPoints(user.points)}
                  </p>
                  <p className="text-xs text-gray-500">보유 포인트</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-gray-700">
                    {user.total_sales}
                  </p>
                  <p className="text-xs text-gray-500">판매</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-gray-700">
                    {user.total_purchases}
                  </p>
                  <p className="text-xs text-gray-500">구매</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-gray-700">
                    {totalTransactions}
                  </p>
                  <p className="text-xs text-gray-500">총 거래</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 추천인 코드 */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                내 추천인 코드
              </h3>
              <p className="text-xs text-gray-400">
                친구에게 공유하면 서로 50 포인트를 받아요!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="px-4 py-2 rounded-lg bg-gray-100 font-mono text-lg font-bold tracking-widest">
                {user.referral_code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReferral}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setTab('selling')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'selling'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="inline mr-2 h-4 w-4" />
          내 프롬프트 ({myPrompts.length})
        </button>
        <button
          onClick={() => setTab('purchased')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'purchased'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="inline mr-2 h-4 w-4" />
          구매한 프롬프트 ({purchasedPrompts.length})
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : tab === 'selling' ? (
        myPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Plus className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              아직 등록한 프롬프트가 없어요
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              첫 번째 프롬프트를 등록하고 포인트를 벌어보세요!
            </p>
            <Button asChild className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white">
              <Link href={ROUTES.PROMPT_CREATE}>프롬프트 등록하기</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myPrompts.map((prompt) => {
              const cat = CATEGORIES.find((c) => c.value === prompt.category)
              return (
                <Link key={prompt.id} href={ROUTES.PROMPT_DETAIL(prompt.id)}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {cat && (
                            <Badge variant="secondary" className="text-xs">
                              {cat.icon} {cat.label}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              prompt.status === 'ACTIVE'
                                ? 'text-green-600 border-green-300'
                                : 'text-gray-400'
                            }`}
                          >
                            {prompt.status === 'ACTIVE' ? '판매 중' : prompt.status}
                          </Badge>
                        </div>
                        <h3 className="font-medium truncate">
                          {prompt.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>
                            판매 {formatCompactNumber(prompt.purchase_count)}건
                          </span>
                          <span>
                            조회 {formatCompactNumber(prompt.view_count)}
                          </span>
                          <span>{formatRelativeTime(prompt.created_at)}</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatPoints(prompt.price)}
                        </p>
                        <p className="text-xs text-gray-400">
                          수익{' '}
                          {formatPoints(
                            prompt.price * prompt.purchase_count
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )
      ) : purchasedPrompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            아직 구매한 프롬프트가 없어요
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            마켓에서 유용한 프롬프트를 찾아보세요!
          </p>
          <Button asChild variant="outline">
            <Link href={ROUTES.PROMPTS}>프롬프트 둘러보기</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {purchasedPrompts.map((prompt) => {
            const cat = CATEGORIES.find((c) => c.value === prompt.category)
            return (
              <Link key={prompt.id} href={ROUTES.PROMPT_DETAIL(prompt.id)}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {cat && (
                          <Badge variant="secondary" className="text-xs">
                            {cat.icon} {cat.label}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium truncate">
                        {prompt.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(prompt.created_at)}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatPoints(prompt.price_paid)}
                      </p>
                      <p className="text-xs text-gray-400">구매가</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  )
}
