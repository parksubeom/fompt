'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIES, POINTS, ROUTES, VALIDATION } from '@/utils/constants'
import { validatePromptForm } from '@/utils/validation'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import type { Prompt, PromptCategory } from '@/types/database'

type PageState = 'loading' | 'ready' | 'not_found' | 'unauthorized'

interface PromptFormData {
  title: string
  description: string
  content: string
  preview: string
  category: PromptCategory | ''
  price: number
  tags: string[]
}

export default function PromptEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  const promptId = params.id as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [form, setForm] = useState<PromptFormData>({
    title: '',
    description: '',
    content: '',
    preview: '',
    category: '',
    price: 0,
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fetchPrompt = useCallback(async () => {
    const { data, error } = await (supabase.from('prompts') as any)
      .select('*')
      .eq('id', promptId)
      .maybeSingle()

    if (error || !data) {
      setPageState('not_found')
      return
    }

    const prompt = data as Prompt

    if (user && prompt.seller_id !== user.id) {
      setPageState('unauthorized')
      return
    }

    setForm({
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
      preview: prompt.preview,
      category: prompt.category,
      price: prompt.price,
      tags: prompt.tags ?? [],
    })
    setPageState('ready')
  }, [promptId, user])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`${ROUTES.LOGIN}?redirect=/prompts/${promptId}/edit`)
      return
    }
    fetchPrompt()
  }, [user, authLoading, router, promptId, fetchPrompt])

  const updateField = <K extends keyof PromptFormData>(
    key: K,
    value: PromptFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (!tag || form.tags.includes(tag) || form.tags.length >= 5) return
    updateField('tags', [...form.tags, tag])
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    updateField('tags', form.tags.filter((t) => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async () => {
    const validationErrors = validatePromptForm({
      title: form.title,
      description: form.description,
      content: form.content,
      preview: form.preview,
      category: form.category,
      price: form.price,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const { error } = await (supabase.from('prompts') as any)
        .update({
          title: form.title,
          description: form.description,
          content: form.content,
          preview: form.preview,
          category: form.category as PromptCategory,
          price: form.price,
          tags: form.tags,
        })
        .eq('id', promptId)

      if (error) {
        setSubmitError('수정에 실패했습니다. 다시 시도해주세요.')
        return
      }

      router.push(ROUTES.PROMPT_DETAIL(promptId))
      router.refresh()
    } catch {
      setSubmitError('예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <h2 className="text-xl font-semibold text-gray-700 mb-2">프롬프트를 찾을 수 없습니다</h2>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.PROMPTS}>목록으로</Link>
        </Button>
      </div>
    )
  }

  if (pageState === 'unauthorized') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">수정 권한이 없습니다</h2>
        <p className="text-sm text-gray-500 mb-4">본인이 등록한 프롬프트만 수정할 수 있습니다.</p>
        <Button asChild variant="outline">
          <Link href={ROUTES.PROMPTS}>목록으로</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <Link
          href={ROUTES.PROMPT_DETAIL(promptId)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          상세로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold">프롬프트 수정</h1>
      </div>

      <div className="space-y-6">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{submitError}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">제목 <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            maxLength={VALIDATION.PROMPT.TITLE.MAX}
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.title ? <span className="text-red-500">{errors.title}</span> : <span />}
            <span>{form.title.length}/{VALIDATION.PROMPT.TITLE.MAX}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>카테고리 <span className="text-red-500">*</span></Label>
            <Select value={form.category} onValueChange={(v) => updateField('category', v as PromptCategory)}>
              <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">가격 (포인트) <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                value={form.price || ''}
                onChange={(e) => updateField('price', parseInt(e.target.value) || 0)}
                min={POINTS.MIN_PURCHASE}
                max={POINTS.MAX_PURCHASE}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">F</span>
            </div>
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">설명 <span className="text-red-500">*</span></Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            maxLength={VALIDATION.PROMPT.DESCRIPTION.MAX}
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.description ? <span className="text-red-500">{errors.description}</span> : <span />}
            <span>{form.description.length}/{VALIDATION.PROMPT.DESCRIPTION.MAX}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preview">미리보기 <span className="text-red-500">*</span></Label>
          <Textarea
            id="preview"
            value={form.preview}
            onChange={(e) => updateField('preview', e.target.value)}
            rows={3}
            maxLength={VALIDATION.PROMPT.PREVIEW.MAX}
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.preview ? <span className="text-red-500">{errors.preview}</span> : <span />}
            <span>{form.preview.length}/{VALIDATION.PROMPT.PREVIEW.MAX}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">프롬프트 본문 <span className="text-red-500">*</span></Label>
          <Textarea
            id="content"
            value={form.content}
            onChange={(e) => updateField('content', e.target.value)}
            rows={8}
            maxLength={VALIDATION.PROMPT.CONTENT.MAX}
            className="font-mono text-sm"
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.content ? <span className="text-red-500">{errors.content}</span> : <span />}
            <span>{form.content.length}/{VALIDATION.PROMPT.CONTENT.MAX}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">태그 (선택, 최대 5개)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="tags"
                placeholder="태그를 입력하고 Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="pl-10"
                disabled={form.tags.length >= 5}
              />
            </div>
            <Button type="button" variant="outline" onClick={handleAddTag} disabled={form.tags.length >= 5 || !tagInput.trim()}>
              추가
            </Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1">
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 rounded-full p-0.5 hover:bg-gray-300/50 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => router.back()}>
            취소
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />변경사항 저장</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
