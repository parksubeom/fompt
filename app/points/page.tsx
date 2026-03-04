'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Gift,
  ShoppingCart,
  DollarSign,
  Users,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils/constants'
import { formatPoints, formatRelativeTime, formatDateTime } from '@/utils/format'
import type { PointTransactionRecord, PointTransactionType } from '@/types/database'

const TX_TYPE_INFO: Record<
  PointTransactionType,
  { label: string; icon: React.ElementType; colorClass: string; bgClass: string }
> = {
  SIGNUP: { label: '가입 보너스', icon: Gift, colorClass: 'text-green-600', bgClass: 'bg-green-50' },
  PURCHASE: { label: '프롬프트 구매', icon: ShoppingCart, colorClass: 'text-red-500', bgClass: 'bg-red-50' },
  SALE: { label: '판매 수익', icon: DollarSign, colorClass: 'text-blue-600', bgClass: 'bg-blue-50' },
  REFERRAL: { label: '추천인 보너스', icon: Users, colorClass: 'text-purple-600', bgClass: 'bg-purple-50' },
}

type FilterType = 'ALL' | PointTransactionType

const PAGE_SIZE = 20

export default function PointsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()

  const [transactions, setTransactions] = useState<PointTransactionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('ALL')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

  const fetchTransactions = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (!user) return

      setIsLoading(true)
      try {
        let query = (supabase.from('point_transactions') as any)
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)

        if (filterType !== 'ALL') {
          query = query.eq('type', filterType)
        }

        const from = pageNum * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        query = query.order('created_at', { ascending: false }).range(from, to)

        const { data, count, error } = await query

        if (error) {
          console.error('Fetch transactions error:', error)
          return
        }

        const rows = (data || []) as PointTransactionRecord[]

        if (reset) {
          setTransactions(rows)
        } else {
          setTransactions((prev) => [...prev, ...rows])
        }

        setTotalCount(count || 0)
        setHasMore(rows.length === PAGE_SIZE)
      } catch {
        console.error('Unexpected error')
      } finally {
        setIsLoading(false)
      }
    },
    [user, filterType]
  )

  const fetchSummary = useCallback(async () => {
    if (!user) return

    const { data } = await (supabase.from('point_transactions') as any)
      .select('type, amount')
      .eq('user_id', user.id)

    if (data) {
      let income = 0
      let expense = 0
      data.forEach((tx: PointTransactionRecord) => {
        if (tx.amount > 0) income += tx.amount
        else expense += Math.abs(tx.amount)
      })
      setTotalIncome(income)
      setTotalExpense(expense)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`${ROUTES.LOGIN}?redirect=/points`)
      return
    }
    fetchSummary()
  }, [user, authLoading, router, fetchSummary])

  useEffect(() => {
    if (!user) return
    setPage(0)
    fetchTransactions(0, true)
  }, [fetchTransactions, user])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchTransactions(nextPage, false)
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Link
          href={ROUTES.PROFILE}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          프로필로 돌아가기
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">포인트 내역</h1>
            <p className="text-sm text-gray-500">포인트 수입/지출 기록을 확인하세요.</p>
          </div>
        </div>
      </div>

      {/* 포인트 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-violet-500" />
              <span className="text-sm text-gray-500">보유 포인트</span>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
              {formatPoints(user.points)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-500">총 수입</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              +{formatPoints(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm text-gray-500">총 지출</span>
            </div>
            <p className="text-2xl font-bold text-red-500">
              -{formatPoints(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 내역</SelectItem>
              <SelectItem value="SIGNUP">가입 보너스</SelectItem>
              <SelectItem value="PURCHASE">프롬프트 구매</SelectItem>
              <SelectItem value="SALE">판매 수익</SelectItem>
              <SelectItem value="REFERRAL">추천인 보너스</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-gray-400">
          {totalCount > 0 ? `총 ${totalCount}건` : ''}
        </span>
      </div>

      {/* 거래 내역 목록 */}
      {isLoading && transactions.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">
            거래 내역이 없습니다
          </h3>
          <p className="text-sm text-gray-400">
            {filterType !== 'ALL'
              ? '선택한 유형의 거래가 없습니다.'
              : '프롬프트를 구매하거나 판매하면 내역이 기록됩니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const info = TX_TYPE_INFO[tx.type]
            const IconComponent = info.icon
            const isIncome = tx.amount > 0

            return (
              <Card key={tx.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  {/* 아이콘 */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${info.bgClass}`}>
                    <IconComponent className={`h-5 w-5 ${info.colorClass}`} />
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">{info.label}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${info.colorClass}`}>
                        {tx.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {tx.description || info.label}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>

                  {/* 금액 */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {isIncome ? (
                        <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                      )}
                      <span
                        className={`text-base font-bold ${
                          isIncome ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {isIncome ? '+' : ''}{formatPoints(tx.amount)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      잔액 {formatPoints(tx.balance_after)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* 더 보기 */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    불러오는 중...
                  </>
                ) : (
                  '더 보기'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
