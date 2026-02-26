'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  ShoppingCart,
  Calendar,
  Lock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CATEGORIES, TIERS, ROUTES } from '@/utils/constants'
import {
  formatPoints,
  formatRelativeTime,
  formatDateTime,
  formatCompactNumber,
} from '@/utils/format'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import type { PromptWithSeller } from '@/types/database'

type PageState = 'loading' | 'ready' | 'not_found' | 'error'

export default function PromptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const promptId = params.id as string

  const [prompt, setPrompt] = useState<PromptWithSeller | null>(null)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [isPurchased, setIsPurchased] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')

  const isOwner = user?.id === prompt?.seller_id

  const fetchPrompt = useCallback(async () => {
    try {
      const { data, error } = await (supabase.from('prompts') as any)
        .select(
          '*, seller:users!seller_id(id, nickname, avatar_url, tier)'
        )
        .eq('id', promptId)
        .maybeSingle()

      if (error || !data) {
        setPageState('not_found')
        return
      }

      setPrompt(data as PromptWithSeller)
      setPageState('ready')
    } catch {
      setPageState('error')
    }
  }, [promptId])

  const checkPurchase = useCallback(async () => {
    if (!user) return
    const { data } = await (supabase.from('purchases') as any)
      .select('id')
      .eq('buyer_id', user.id)
      .eq('prompt_id', promptId)
      .maybeSingle()

    setIsPurchased(!!data)
  }, [user, promptId])

  const incrementViewCount = useCallback(async () => {
    await (supabase.rpc as any)('increment_view_count', {
      prompt_id: promptId,
    }).catch(() => {})
  }, [promptId])

  useEffect(() => {
    fetchPrompt()
    incrementViewCount()
  }, [fetchPrompt, incrementViewCount])

  useEffect(() => {
    if (prompt && user) {
      checkPurchase()
    }
  }, [prompt, user, checkPurchase])

  const handlePurchase = async () => {
    if (!user || !prompt) return

    if (user.points < prompt.price) {
      setPurchaseError(
        `포인트가 부족합니다. (보유: ${formatPoints(user.points)}, 필요: ${formatPoints(prompt.price)})`
      )
      return
    }

    setIsPurchasing(true)
    setPurchaseError('')

    try {
      const { error } = await (supabase.rpc as any)('purchase_prompt', {
        p_buyer_id: user.id,
        p_prompt_id: prompt.id,
        p_seller_id: prompt.seller_id,
        p_price: prompt.price,
      })

      if (error) {
        if (error.message?.includes('already purchased')) {
          setIsPurchased(true)
          return
        }
        setPurchaseError('구매에 실패했습니다. 다시 시도해주세요.')
        console.error('Purchase error:', error)
        return
      }

      setIsPurchased(true)
      router.refresh()
    } catch {
      setPurchaseError('예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsPurchasing(false)
    }
  }

  const canViewContent = isOwner || isPurchased
  const category = prompt
    ? CATEGORIES.find((c) => c.value === prompt.category)
    : null
  const tierInfo = prompt ? TIERS[prompt.seller.tier] : null

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (pageState === 'not_found') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          프롬프트를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          삭제되었거나 존재하지 않는 프롬프트입니다.
        </p>
        <Button asChild variant="outline">
          <Link href={ROUTES.PROMPTS}>목록으로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  if (pageState === 'error' || !prompt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          잠시 후 다시 시도해주세요.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          새로고침
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* 뒤로가기 */}
      <Link
        href={ROUTES.PROMPTS}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        목록으로
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 콘텐츠 (좌측 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 헤더 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {category && (
                <Badge variant="secondary">
                  {category.icon} {category.label}
                </Badge>
              )}
              {isOwner && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-300"
                >
                  내 프롬프트
                </Badge>
              )}
              {isPurchased && !isOwner && (
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-300"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  구매 완료
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{prompt.title}</h1>
            <p className="text-gray-600">{prompt.description}</p>
          </div>

          {/* 미리보기 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              미리보기
            </h2>
            <div className="rounded-lg bg-gradient-to-br from-violet-50 to-cyan-50 p-5 text-sm whitespace-pre-wrap leading-relaxed">
              {prompt.preview}
            </div>
          </div>

          {/* 프롬프트 본문 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              프롬프트 본문
            </h2>
            {canViewContent ? (
              <div className="rounded-lg border bg-white p-5 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {prompt.content}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                <Lock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-1">
                  구매 후 열람 가능합니다
                </p>
                <p className="text-xs text-gray-400">
                  프롬프트 본문은 구매한 사용자만 볼 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* 태그 */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prompt.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 사이드바 (우측 1/3) */}
        <div className="space-y-4">
          {/* 가격 & 구매 카드 */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">가격</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
                  {formatPoints(prompt.price)}
                </p>
              </div>

              {!isOwner && !isPurchased && (
                <>
                  {user ? (
                    <Button
                      className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          구매 중...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          구매하기
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
                      asChild
                    >
                      <Link
                        href={`${ROUTES.LOGIN}?redirect=/prompts/${prompt.id}`}
                      >
                        로그인 후 구매
                      </Link>
                    </Button>
                  )}

                  {user && (
                    <p className="text-xs text-center text-gray-400">
                      보유 포인트: {formatPoints(user.points)}
                    </p>
                  )}

                  {purchaseError && (
                    <p className="text-xs text-red-500 text-center">
                      {purchaseError}
                    </p>
                  )}
                </>
              )}

              {isPurchased && !isOwner && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">구매 완료</span>
                </div>
              )}

              {isOwner && (
                <div className="flex items-center justify-center gap-2 text-primary bg-violet-50 rounded-lg p-3">
                  <span className="text-sm font-medium">
                    내가 등록한 프롬프트
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 판매자 정보 카드 */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                판매자
              </h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={prompt.seller.avatar_url || undefined}
                    alt={prompt.seller.nickname}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                    {prompt.seller.nickname[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {prompt.seller.nickname}
                  </p>
                  {tierInfo && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${tierInfo.colorClass}`}
                    >
                      {tierInfo.badge} {tierInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 통계 카드 */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                통계
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-lg bg-gray-50">
                  <Eye className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-semibold">
                    {formatCompactNumber(prompt.view_count)}
                  </p>
                  <p className="text-xs text-gray-400">조회</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-gray-50">
                  <ShoppingCart className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-semibold">
                    {formatCompactNumber(prompt.purchase_count)}
                  </p>
                  <p className="text-xs text-gray-400">판매</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDateTime(prompt.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
