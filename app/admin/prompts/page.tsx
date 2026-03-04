'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronDown,
  Loader2,
  FileX,
  Eye,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { formatPoints, formatRelativeTime, formatCompactNumber } from '@/utils/format'
import { CATEGORIES, ROUTES } from '@/utils/constants'
import { toast } from 'sonner'
import type { PromptStatus } from '@/types/database'

const PAGE_SIZE = 20

type SortField = 'created_at' | 'purchase_count' | 'view_count' | 'price'
type StatusFilter = 'ALL' | PromptStatus

interface AdminPrompt {
  id: string
  title: string
  category: string
  price: number
  purchase_count: number
  view_count: number
  rating_avg: number
  status: PromptStatus
  created_at: string
  seller: { id: string; nickname: string }
}

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<AdminPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchPrompts = useCallback(
    async (reset = false) => {
      setLoading(true)
      try {
        const currentPage = reset ? 0 : page
        const from = currentPage * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = (supabase.from('prompts') as any).select(
          'id, title, category, price, purchase_count, view_count, rating_avg, status, created_at, seller:users!seller_id(id, nickname)',
          { count: 'exact' }
        )

        if (searchQuery.trim()) {
          query = query.ilike('title', `%${searchQuery.trim()}%`)
        }

        if (statusFilter !== 'ALL') {
          query = query.eq('status', statusFilter)
        }

        query = query.order(sortField, { ascending: false }).range(from, to)

        const { data, count, error } = await query
        if (error) throw error

        if (reset) {
          setPrompts(data || [])
          setPage(0)
        } else {
          setPrompts((prev) =>
            currentPage === 0 ? data || [] : [...prev, ...(data || [])]
          )
        }

        setTotalCount(count || 0)
        setHasMore((data?.length || 0) === PAGE_SIZE)
      } catch (err) {
        console.error('Fetch prompts error:', err)
        toast.error('프롬프트 목록을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [page, searchQuery, sortField, statusFilter]
  )

  useEffect(() => {
    fetchPrompts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortField, statusFilter])

  const loadMore = () => setPage((p) => p + 1)

  useEffect(() => {
    if (page > 0) fetchPrompts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleStatusChange = async (
    promptId: string,
    newStatus: PromptStatus
  ) => {
    setUpdatingId(promptId)
    try {
      const { error } = await (supabase.rpc as any)(
        'admin_update_prompt_status',
        { p_prompt_id: promptId, p_status: newStatus }
      )

      if (error) throw error

      setPrompts((prev) =>
        prev.map((p) => (p.id === promptId ? { ...p, status: newStatus } : p))
      )
      toast.success(
        newStatus === 'DELETED'
          ? '프롬프트가 비활성화되었습니다.'
          : '프롬프트가 활성화되었습니다.'
      )
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat)
    return found ? `${found.icon} ${found.label}` : cat
  }

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'created_at', label: '최신순' },
    { value: 'purchase_count', label: '판매순' },
    { value: 'view_count', label: '조회순' },
    { value: 'price', label: '가격순' },
  ]

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: '전체' },
    { value: 'ACTIVE', label: '활성' },
    { value: 'DELETED', label: '삭제됨' },
    { value: 'SOLD_OUT', label: '품절' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          프롬프트 관리
          <span className="text-sm font-normal text-gray-400 ml-2">
            {totalCount}개
          </span>
        </h2>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="프롬프트 제목으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {statusOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(opt.value)}
                  className={
                    statusFilter === opt.value
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : ''
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="h-6 w-px bg-gray-200 self-center hidden sm:block" />
            <div className="flex gap-1">
              {sortOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={sortField === opt.value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortField(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 프롬프트 목록 */}
      <Card>
        <CardContent className="p-0">
          {loading && prompts.length === 0 ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : prompts.length === 0 ? (
            <div className="p-12 text-center">
              <FileX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {prompts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={ROUTES.PROMPT_DETAIL(p.id)}
                        className="text-sm font-medium truncate hover:text-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          p.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-600'
                            : p.status === 'DELETED'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.status === 'ACTIVE'
                          ? '활성'
                          : p.status === 'DELETED'
                          ? '삭제됨'
                          : '품절'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{getCategoryLabel(p.category)}</span>
                      <span>{p.seller?.nickname}</span>
                      <span>{formatRelativeTime(p.created_at)}</span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">
                        {formatPoints(p.price)}
                      </p>
                      <p>가격</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">
                        {formatCompactNumber(p.view_count)}
                      </p>
                      <p>조회</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700">
                        {p.purchase_count}
                      </p>
                      <p>판매</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link href={ROUTES.PROMPT_DETAIL(p.id)} target="_blank">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    {p.status === 'ACTIVE' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(p.id, 'DELETED')}
                        disabled={updatingId === p.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        {updatingId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ToggleRight className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(p.id, 'ACTIVE')}
                        disabled={updatingId === p.id}
                        className="text-green-500 hover:text-green-600 hover:bg-green-50"
                      >
                        {updatingId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && prompts.length > 0 && (
            <div className="p-4 text-center border-t">
              <Button
                variant="ghost"
                onClick={loadMore}
                disabled={loading}
                className="text-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                더보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
