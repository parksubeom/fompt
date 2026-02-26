'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Eye, Sparkles, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatPoints } from '@/utils/format'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import type { PromptCategory } from '@/types/database'

type FormStep = 'edit' | 'preview'

interface PromptFormData {
  title: string
  description: string
  content: string
  preview: string
  category: PromptCategory | ''
  price: number
  tags: string[]
}

const INITIAL_FORM: PromptFormData = {
  title: '',
  description: '',
  content: '',
  preview: '',
  category: '',
  price: 0,
  tags: [],
}

export default function PromptCreatePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [step, setStep] = useState<FormStep>('edit')
  const [form, setForm] = useState<PromptFormData>(INITIAL_FORM)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
    if (!tag) return
    if (form.tags.includes(tag)) {
      setTagInput('')
      return
    }
    if (form.tags.length >= 5) return
    updateField('tags', [...form.tags, tag])
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    updateField(
      'tags',
      form.tags.filter((t) => t !== tagToRemove)
    )
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handlePreview = () => {
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

    setErrors({})
    setStep('preview')
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const { error } = await (supabase.from('prompts') as any).insert({
        seller_id: user.id,
        title: form.title,
        description: form.description,
        content: form.content,
        preview: form.preview,
        category: form.category as PromptCategory,
        price: form.price,
        tags: form.tags,
      })

      if (error) {
        console.error('Prompt creation error:', error)
        setSubmitError('프롬프트 등록에 실패했습니다. 다시 시도해주세요.')
        return
      }

      router.push(ROUTES.PROMPTS)
      router.refresh()
    } catch (err) {
      console.error('Unexpected error:', err)
      setSubmitError('예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = CATEGORIES.find((c) => c.value === form.category)

  if (step === 'preview') {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('edit')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            수정하기
          </Button>
          <h2 className="text-lg font-semibold text-gray-700">미리보기</h2>
          <div className="w-20" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedCategory && (
                <Badge variant="secondary">
                  {selectedCategory.icon} {selectedCategory.label}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-primary border-primary/30"
              >
                {formatPoints(form.price)}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            <p className="text-gray-600 mt-2">{form.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                미리보기
              </h3>
              <div className="rounded-lg bg-gradient-to-br from-violet-50 to-cyan-50 p-4 text-sm whitespace-pre-wrap">
                {form.preview}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                프롬프트 본문 (구매 후 공개)
              </h3>
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-sm whitespace-pre-wrap bg-gray-50/50">
                {form.content}
              </div>
            </div>

            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {submitError && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-md p-3">
            {submitError}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setStep('edit')}
          >
            수정하기
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              '등록 중...'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                프롬프트 등록하기
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* 상단 헤더 */}
      <div className="mb-8">
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          돌아가기
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">프롬프트 등록</h1>
            <p className="text-sm text-gray-500">
              나만의 프롬프트를 판매해보세요
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="프롬프트의 제목을 입력하세요 (5~100자)"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            maxLength={VALIDATION.PROMPT.TITLE.MAX}
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.title ? (
              <span className="text-red-500">{errors.title}</span>
            ) : (
              <span />
            )}
            <span>
              {form.title.length}/{VALIDATION.PROMPT.TITLE.MAX}
            </span>
          </div>
        </div>

        {/* 카테고리 & 가격 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              카테고리 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                updateField('category', v as PromptCategory)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              가격 (포인트) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                placeholder={`${POINTS.MIN_PURCHASE} ~ ${POINTS.MAX_PURCHASE.toLocaleString()}`}
                value={form.price || ''}
                onChange={(e) =>
                  updateField('price', parseInt(e.target.value) || 0)
                }
                min={POINTS.MIN_PURCHASE}
                max={POINTS.MAX_PURCHASE}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                F
              </span>
            </div>
            {errors.price && (
              <p className="text-xs text-red-500">{errors.price}</p>
            )}
          </div>
        </div>

        {/* 설명 */}
        <div className="space-y-2">
          <Label htmlFor="description">
            설명 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="프롬프트에 대한 간단한 설명을 작성하세요 (10~500자)"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            maxLength={VALIDATION.PROMPT.DESCRIPTION.MAX}
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.description ? (
              <span className="text-red-500">{errors.description}</span>
            ) : (
              <span />
            )}
            <span>
              {form.description.length}/{VALIDATION.PROMPT.DESCRIPTION.MAX}
            </span>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="space-y-2">
          <Label htmlFor="preview">
            미리보기 <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-gray-500">
            구매 전 사용자에게 보여지는 샘플입니다. 프롬프트의 일부를 보여주세요.
          </p>
          <Textarea
            id="preview"
            placeholder="프롬프트의 미리보기를 작성하세요 (10~200자)"
            value={form.preview}
            onChange={(e) => updateField('preview', e.target.value)}
            rows={3}
            maxLength={VALIDATION.PROMPT.PREVIEW.MAX}
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.preview ? (
              <span className="text-red-500">{errors.preview}</span>
            ) : (
              <span />
            )}
            <span>
              {form.preview.length}/{VALIDATION.PROMPT.PREVIEW.MAX}
            </span>
          </div>
        </div>

        {/* 본문 (프롬프트 내용) */}
        <div className="space-y-2">
          <Label htmlFor="content">
            프롬프트 본문 <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-gray-500">
            구매 후 공개되는 실제 프롬프트입니다. 구체적이고 활용 가능한 내용을
            작성하세요.
          </p>
          <Textarea
            id="content"
            placeholder="실제 프롬프트 내용을 입력하세요 (20~5000자)"
            value={form.content}
            onChange={(e) => updateField('content', e.target.value)}
            rows={8}
            maxLength={VALIDATION.PROMPT.CONTENT.MAX}
            className="font-mono text-sm"
          />
          <div className="flex justify-between text-xs text-gray-400">
            {errors.content ? (
              <span className="text-red-500">{errors.content}</span>
            ) : (
              <span />
            )}
            <span>
              {form.content.length}/{VALIDATION.PROMPT.CONTENT.MAX}
            </span>
          </div>
        </div>

        {/* 태그 */}
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
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={form.tags.length >= 5 || !tagInput.trim()}
            >
              추가
            </Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1 pl-2 pr-1 py-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 rounded-full p-0.5 hover:bg-gray-300/50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 안내 */}
        <Card className="bg-gradient-to-br from-violet-50/50 to-cyan-50/50 border-primary/10">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              등록 시 참고사항
            </h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>
                - 가격은 {POINTS.MIN_PURCHASE} ~{' '}
                {POINTS.MAX_PURCHASE.toLocaleString()} 포인트 범위입니다.
              </li>
              <li>- 프롬프트가 판매되면 설정 가격만큼 포인트가 적립됩니다.</li>
              <li>
                - 부적절한 콘텐츠는 관리자에 의해 삭제될 수 있습니다.
              </li>
              <li>- 등록 후에도 수정이 가능합니다.</li>
            </ul>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
            onClick={handlePreview}
          >
            <Eye className="mr-2 h-4 w-4" />
            미리보기 & 등록
          </Button>
        </div>
      </div>
    </div>
  )
}
