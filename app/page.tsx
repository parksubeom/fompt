'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Flame,
  ArrowRight,
  Users,
  ShoppingCart,
  Star,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { PromptCard } from '@/components/features/prompt/PromptCard'
import { StarRating } from '@/components/features/review/StarRating'
import { CATEGORIES, TIERS, ROUTES } from '@/utils/constants'
import { formatPoints, formatCompactNumber, formatRelativeTime } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import type { PromptWithSeller, ReviewWithUser } from '@/types/database'

interface PlatformStats {
  totalPrompts: number
  totalUsers: number
  totalTransactions: number
}

interface CategoryCount {
  category: string
  count: number
}

export default function Home() {
  const { user } = useAuthStore()

  const [trendingPrompts, setTrendingPrompts] = useState<PromptWithSeller[]>([])
  const [latestPrompts, setLatestPrompts] = useState<PromptWithSeller[]>([])
  const [recentReviews, setRecentReviews] = useState<(ReviewWithUser & { prompt_title: string })[]>([])
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])
  const [stats, setStats] = useState<PlatformStats>({ totalPrompts: 0, totalUsers: 0, totalTransactions: 0 })
  const [isLoading, setIsLoading] = useState(true)

  const fetchHomeData = useCallback(async () => {
    try {
      const [trendingRes, latestRes, reviewsRes, promptCountRes, userCountRes] = await Promise.all([
        (supabase.from('prompts') as any)
          .select('*, seller:users!seller_id(id, nickname, avatar_url, tier)')
          .eq('status', 'ACTIVE')
          .order('purchase_count', { ascending: false })
          .limit(4),

        (supabase.from('prompts') as any)
          .select('*, seller:users!seller_id(id, nickname, avatar_url, tier)')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(4),

        (supabase.from('reviews') as any)
          .select('*, reviewer:users!reviewer_id(id, nickname, avatar_url, tier), prompt:prompts!prompt_id(title)')
          .gte('rating', 4)
          .order('created_at', { ascending: false })
          .limit(3),

        (supabase.from('prompts') as any)
          .select('id, category', { count: 'exact' })
          .eq('status', 'ACTIVE'),

        (supabase.from('users') as any)
          .select('id', { count: 'exact' }),
      ])

      if (trendingRes.data) setTrendingPrompts(trendingRes.data)
      if (latestRes.data) setLatestPrompts(latestRes.data)

      if (reviewsRes.data) {
        const mapped = reviewsRes.data.map((r: any) => ({
          ...r,
          prompt_title: r.prompt?.title || '',
          prompt: undefined,
          reviewer: r.reviewer,
        }))
        setRecentReviews(mapped)
      }

      if (promptCountRes.data) {
        const countMap: Record<string, number> = {}
        promptCountRes.data.forEach((p: any) => {
          countMap[p.category] = (countMap[p.category] || 0) + 1
        })
        setCategoryCounts(
          CATEGORIES.map((c) => ({ category: c.value, count: countMap[c.value] || 0 }))
        )
        setStats((prev) => ({ ...prev, totalPrompts: promptCountRes.count || 0 }))
      }

      if (userCountRes.count) {
        setStats((prev) => ({ ...prev, totalUsers: userCountRes.count }))
      }

      const totalTx = (trendingRes.data || []).reduce(
        (sum: number, p: any) => sum + (p.purchase_count || 0), 0
      )
      setStats((prev) => ({
        ...prev,
        totalTransactions: promptCountRes.data
          ? promptCountRes.data.reduce((s: number, p: any) => s, 0) + totalTx
          : totalTx,
      }))
    } catch (err) {
      console.error('Failed to fetch home data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHomeData()
  }, [fetchHomeData])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-100/40 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center justify-center py-20 md:py-28">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm bg-white/80 backdrop-blur-sm border-violet-200">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-500" />
              Korean Prompt Marketplace
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent text-center mb-6 leading-tight">
              FOMPT
            </h1>

            <p className="text-xl md:text-2xl text-gray-700 text-center mb-3 font-medium">
              네 아이디어, 폼 나게 팔자
            </p>
            <p className="text-sm md:text-base text-gray-500 text-center max-w-2xl mb-8 leading-relaxed">
              AI 프롬프트를 사고파는 한국어 마켓플레이스.
              가입하면 바로 100 포인트 지급! 현금 없이 포인트로만 거래하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <>
                  <Button
                    size="lg"
                    asChild
                    className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90 shadow-lg shadow-violet-500/20"
                  >
                    <Link href={ROUTES.PROMPT_CREATE}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      프롬프트 판매하기
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="bg-white/80 backdrop-blur-sm">
                    <Link href={ROUTES.PROMPTS}>프롬프트 둘러보기</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    asChild
                    className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90 shadow-lg shadow-violet-500/20"
                  >
                    <Link href={ROUTES.SIGNUP}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      무료로 시작하기
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="bg-white/80 backdrop-blur-sm">
                    <Link href={ROUTES.PROMPTS}>프롬프트 둘러보기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="border-y bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-3 divide-x">
            <div className="text-center px-4">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
                {isLoading ? '-' : formatCompactNumber(stats.totalPrompts)}
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">등록 프롬프트</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
                {isLoading ? '-' : formatCompactNumber(stats.totalUsers)}
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">가입 회원</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
                100%
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">포인트 거래</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Trending Prompts */}
        <section className="py-12 md:py-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">인기 프롬프트</h2>
                <p className="text-xs text-gray-500">가장 많이 판매된 프롬프트</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-primary">
              <Link href={`${ROUTES.PROMPTS}?sort=popular`}>
                전체보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex justify-between pt-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : trendingPrompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
          </div>
        </section>

        {/* Latest Prompts */}
        <section className="py-12 md:py-16 border-t">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">최신 프롬프트</h2>
                <p className="text-xs text-gray-500">방금 등록된 따끈따끈한 프롬프트</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-primary">
              <Link href={`${ROUTES.PROMPTS}?sort=latest`}>
                전체보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex justify-between pt-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : latestPrompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
          </div>
        </section>

        {/* Category Showcase */}
        <section className="py-12 md:py-16 border-t">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <BarChart3 className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">카테고리별 탐색</h2>
              <p className="text-xs text-gray-500">관심 분야의 프롬프트를 찾아보세요</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const countInfo = categoryCounts.find((c) => c.category === cat.value)
              return (
                <Link
                  key={cat.value}
                  href={`${ROUTES.PROMPTS}?category=${cat.value}`}
                >
                  <Card className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="text-2xl flex-shrink-0">{cat.icon}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {cat.label}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isLoading ? '...' : `${countInfo?.count || 0}개`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary ml-auto flex-shrink-0 transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Recent Reviews */}
        {recentReviews.length > 0 && (
          <section className="py-12 md:py-16 border-t">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">최근 리뷰</h2>
                <p className="text-xs text-gray-500">구매자들의 생생한 후기</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentReviews.map((review) => {
                const tierInfo = TIERS[review.reviewer.tier]
                return (
                  <Card key={review.id} className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={review.reviewer.avatar_url || undefined}
                            alt={review.reviewer.nickname}
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                            {review.reviewer.nickname[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium truncate">
                              {review.reviewer.nickname}
                            </span>
                            <span className="text-xs flex-shrink-0">{tierInfo.badge}</span>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="truncate max-w-[60%]">{review.prompt_title}</span>
                        <span className="flex-shrink-0">{formatRelativeTime(review.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-12 md:py-16 border-t">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              왜 FOMPT인가요?
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              AI 프롬프트 거래를 위한 최적의 플랫폼
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-none bg-gradient-to-br from-violet-50 to-violet-50/30">
              <CardHeader>
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <CardTitle className="text-lg">100% 포인트 거래</CardTitle>
                <CardDescription className="leading-relaxed">
                  가입 시 100 포인트 지급. 현금 결제 없이 포인트로만 프롬프트를 사고팔 수 있습니다. 추천인 코드로 추가 포인트도 획득하세요.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-none bg-gradient-to-br from-cyan-50 to-cyan-50/30">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">등급 & 리뷰 시스템</CardTitle>
                <CardDescription className="leading-relaxed">
                  거래 횟수에 따라 등급이 올라갑니다. 구매 후 리뷰를 남겨 다른 사용자에게 도움을 줄 수 있습니다. 신뢰할 수 있는 마켓플레이스.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-none bg-gradient-to-br from-violet-50 to-cyan-50/30">
              <CardHeader>
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-violet-600" />
                </div>
                <CardTitle className="text-lg">안전한 커뮤니티</CardTitle>
                <CardDescription className="leading-relaxed">
                  PG사 연동 없이 순수 포인트로 거래합니다. 구매 전 미리보기 확인, 구매 후 전체 본문 열람. 판매자와 구매자 모두 보호받습니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 border-t">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-2xl p-8 md:p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1),_transparent)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                아이디어를 포인트로 바꿔보세요
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                당신의 창의적인 프롬프트를 판매하거나, 필요한 프롬프트를 구매하세요.
                {!user && ' 지금 가입하면 100 포인트를 무료로 드립니다!'}
              </p>
              {user ? (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" asChild className="bg-white text-violet-700 hover:bg-white/90">
                    <Link href={ROUTES.PROMPT_CREATE}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      프롬프트 등록하기
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <Link href={ROUTES.PROMPTS}>
                      마켓 둘러보기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button size="lg" asChild className="bg-white text-violet-700 hover:bg-white/90">
                  <Link href={ROUTES.SIGNUP}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    무료로 시작하기
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
