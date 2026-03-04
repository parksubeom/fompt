'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PromptCard } from '@/components/features/prompt/PromptCard'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/utils/constants'
import type { PromptWithSeller } from '@/types/database'

export default function BookmarksPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  const [prompts, setPrompts] = useState<PromptWithSeller[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBookmarks = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await (supabase.from('bookmarks') as any)
        .select('prompt:prompts!prompt_id(*, seller:users!seller_id(id, nickname, avatar_url, tier))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        const mapped = data
          .map((row: any) => row.prompt)
          .filter((p: any) => p && p.status === 'ACTIVE') as PromptWithSeller[]
        setPrompts(mapped)
      }
    } catch {
      console.error('Failed to fetch bookmarks')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`${ROUTES.LOGIN}?redirect=/bookmarks`)
      return
    }
    fetchBookmarks()
  }, [user, authLoading, router, fetchBookmarks])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
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
            <Bookmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">즐겨찾기</h1>
            <p className="text-sm text-gray-500">
              {prompts.length > 0
                ? `${prompts.length}개의 프롬프트를 저장했습니다`
                : '관심 있는 프롬프트를 저장해보세요'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="h-14 w-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">
            저장한 프롬프트가 없습니다
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            마음에 드는 프롬프트를 북마크 아이콘으로 저장해보세요.
          </p>
          <Button asChild variant="outline">
            <Link href={ROUTES.PROMPTS}>프롬프트 둘러보기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  )
}
