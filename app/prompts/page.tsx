'use client'

import { Suspense, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, Sparkles, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PromptCard } from '@/components/features/prompt/PromptCard'
import { CATEGORIES } from '@/utils/constants'
import { supabase } from '@/lib/supabase'
import type { PromptCategory, PromptWithSeller } from '@/types/database'

type SortOption = 'latest' | 'popular' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

const PAGE_SIZE = 12

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function PromptsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialCategory = (searchParams.get('category') as PromptCategory | 'ALL') || 'ALL'
  const initialSort = (searchParams.get('sort') as SortOption) || 'latest'
  const initialSearch = searchParams.get('q') || ''
  const initialTag = searchParams.get('tag') || ''

  const [prompts, setPrompts] = useState<PromptWithSeller[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState<PromptCategory | 'ALL'>(initialCategory)
  const [sortBy, setSortBy] = useState<SortOption>(initialSort)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [tagFilter, setTagFilter] = useState(initialTag)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const debouncedSearch = useDebounce(searchInput, 400)
  const isFirstRender = useRef(true)

  const updateURL = useCallback(
    (params: { q?: string; category?: string; sort?: string; tag?: string }) => {
      const url = new URLSearchParams()
      const q = params.q ?? debouncedSearch
      const cat = params.category ?? category
      const sort = params.sort ?? sortBy
      const tag = params.tag ?? tagFilter

      if (q) url.set('q', q)
      if (cat !== 'ALL') url.set('category', cat)
      if (sort !== 'latest') url.set('sort', sort)
      if (tag) url.set('tag', tag)

      const qs = url.toString()
      router.replace(`/prompts${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, debouncedSearch, category, sortBy, tagFilter]
  )

  const fetchPrompts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      setIsLoading(true)
      try {
        let query = (supabase.from('prompts') as any)
          .select(
            '*, seller:users!seller_id(id, nickname, avatar_url, tier)',
            { count: 'exact' }
          )
          .eq('status', 'ACTIVE')

        if (category !== 'ALL') {
          query = query.eq('category', category)
        }

        if (debouncedSearch) {
          query = query.or(
            `title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`
          )
        }

        if (tagFilter) {
          query = query.contains('tags', [tagFilter.toLowerCase()])
        }

        switch (sortBy) {
          case 'latest':
            query = query.order('created_at', { ascending: false })
            break
          case 'popular':
            query = query.order('purchase_count', { ascending: false })
            break
          case 'price_asc':
            query = query.order('price', { ascending: true })
            break
          case 'price_desc':
            query = query.order('price', { ascending: false })
            break
        }

        const from = pageNum * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        query = query.range(from, to)

        const { data, count, error } = await query

        if (error) {
          console.error('Fetch prompts error:', error)
          return
        }

        const fetched = (data ?? []) as PromptWithSeller[]

        if (reset) {
          setPrompts(fetched)
        } else {
          setPrompts((prev) => [...prev, ...fetched])
        }

        setTotalCount(count ?? 0)
        setHasMore(fetched.length === PAGE_SIZE)
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [category, sortBy, debouncedSearch, tagFilter]
  )

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    } else {
      updateURL({})
    }
    setPage(0)
    fetchPrompts(0, true)
  }, [fetchPrompts]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPrompts(nextPage, false)
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value as PromptCategory | 'ALL')
  }

  const handleClearFilters = () => {
    setCategory('ALL')
    setSortBy('latest')
    setSearchInput('')
    setTagFilter('')
    router.replace('/prompts', { scroll: false })
  }

  const handleTagClick = (tag: string) => {
    setTagFilter(tag.toLowerCase())
  }

  const hasActiveFilters =
    category !== 'ALL' || sortBy !== 'latest' || debouncedSearch !== '' || tagFilter !== ''

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">프롬프트 마켓</h1>
            <p className="text-sm text-gray-500">
              {totalCount > 0
                ? `${totalCount.toLocaleString()}개의 프롬프트`
                : '다양한 프롬프트를 둘러보세요'}
            </p>
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="mb-6 space-y-4">
        {/* 검색 - 디바운스 적용 (입력 즉시 반영) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="프롬프트 제목, 설명 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 태그 검색 */}
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="태그로 검색 (예: React, 블로그, 마케팅)"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 카테고리 & 정렬 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              필터 초기화
            </Button>
          )}
        </div>

        {/* 활성 필터 표시 */}
        {(debouncedSearch || tagFilter) && (
          <div className="flex flex-wrap items-center gap-2">
            {debouncedSearch && (
              <>
                <span className="text-sm text-gray-500">검색:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  &ldquo;{debouncedSearch}&rdquo;
                  <button
                    onClick={() => setSearchInput('')}
                    className="ml-1 hover:text-red-500"
                  >
                    &times;
                  </button>
                </Badge>
              </>
            )}
            {tagFilter && (
              <>
                <span className="text-sm text-gray-500">태그:</span>
                <Badge variant="outline" className="flex items-center gap-1 text-primary">
                  #{tagFilter}
                  <button
                    onClick={() => setTagFilter('')}
                    className="ml-1 hover:text-red-500"
                  >
                    &times;
                  </button>
                </Badge>
              </>
            )}
          </div>
        )}
      </div>

      {/* 프롬프트 그리드 */}
      {isLoading && prompts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            프롬프트가 없습니다
          </h3>
          <p className="text-sm text-gray-500">
            {hasActiveFilters
              ? '필터 조건을 변경해보세요.'
              : '첫 번째 프롬프트를 등록해보세요!'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} onTagClick={handleTagClick} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-8"
              >
                {isLoading ? '불러오는 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function PromptsPage() {
  return (
    <Suspense>
      <PromptsContent />
    </Suspense>
  )
}
