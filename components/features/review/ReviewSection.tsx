'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  MessageSquare,
  Loader2,
  Pencil,
  Trash2,
  Send,
  X,
  AlertCircle,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/features/review/StarRating'
import { TIERS } from '@/utils/constants'
import { formatRelativeTime } from '@/utils/format'
import { validateReviewRating, validateReviewComment } from '@/utils/validation'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { ReviewWithUser } from '@/types/database'

interface ReviewSectionProps {
  promptId: string
  sellerId: string
  isPurchased: boolean
  isOwner: boolean
}

const REVIEWS_PAGE_SIZE = 5

export function ReviewSection({
  promptId,
  sellerId,
  isPurchased,
  isOwner,
}: ReviewSectionProps) {
  const { user } = useAuthStore()

  const [reviews, setReviews] = useState<ReviewWithUser[]>([])
  const [reviewCount, setReviewCount] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const [myReview, setMyReview] = useState<ReviewWithUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')

  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)

  const canReview = user && isPurchased && !isOwner && !myReview

  const fetchReviews = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        const from = pageNum * REVIEWS_PAGE_SIZE
        const to = from + REVIEWS_PAGE_SIZE - 1

        const { data, error, count } = await (supabase.from('reviews') as any)
          .select(
            '*, reviewer:users!reviewer_id(id, nickname, avatar_url, tier)',
            { count: 'exact' }
          )
          .eq('prompt_id', promptId)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) {
          console.error('Failed to fetch reviews:', error)
          return
        }

        const reviewData = (data || []) as ReviewWithUser[]
        setReviews((prev) => (append ? [...prev, ...reviewData] : reviewData))
        setReviewCount(count || 0)
        setHasMore(reviewData.length === REVIEWS_PAGE_SIZE)

        if (user) {
          const mine = reviewData.find((r) => r.reviewer_id === user.id)
          if (mine) setMyReview(mine)
        }
      } catch {
        console.error('Unexpected error fetching reviews')
      } finally {
        setIsLoading(false)
      }
    },
    [promptId, user]
  )

  const fetchStats = useCallback(async () => {
    const { data, error } = await (supabase.from('reviews') as any)
      .select('rating')
      .eq('prompt_id', promptId)

    if (!error && data) {
      const ratings = data.map((r: { rating: number }) => r.rating)
      if (ratings.length > 0) {
        const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        setAverageRating(Math.round(avg * 100) / 100)
        setReviewCount(ratings.length)
      }
    }
  }, [promptId])

  const findMyReview = useCallback(async () => {
    if (!user) return
    const { data } = await (supabase.from('reviews') as any)
      .select(
        '*, reviewer:users!reviewer_id(id, nickname, avatar_url, tier)'
      )
      .eq('prompt_id', promptId)
      .eq('reviewer_id', user.id)
      .maybeSingle()

    if (data) setMyReview(data as ReviewWithUser)
  }, [user, promptId])

  useEffect(() => {
    fetchReviews(0)
    fetchStats()
  }, [fetchReviews, fetchStats])

  useEffect(() => {
    if (user && isPurchased) {
      findMyReview()
    }
  }, [user, isPurchased, findMyReview])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviews(nextPage, true)
  }

  const handleSubmit = async () => {
    if (!user) return

    const errors: Record<string, string> = {}
    const ratingResult = validateReviewRating(newRating)
    if (!ratingResult.isValid) errors.rating = ratingResult.error!
    const commentResult = validateReviewComment(newComment)
    if (!commentResult.isValid) errors.comment = commentResult.error!

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setFormErrors({})

    try {
      const { error } = await (supabase.rpc as any)('submit_review', {
        p_reviewer_id: user.id,
        p_prompt_id: promptId,
        p_rating: newRating,
        p_comment: newComment.trim(),
      })

      if (error) {
        if (error.message?.includes('already reviewed')) {
          setSubmitError('이미 리뷰를 작성하셨습니다.')
        } else if (error.message?.includes('purchase required')) {
          setSubmitError('구매한 프롬프트만 리뷰할 수 있습니다.')
        } else {
          setSubmitError('리뷰 등록에 실패했습니다. 다시 시도해주세요.')
        }
        return
      }

      setNewRating(0)
      setNewComment('')
      setPage(0)
      toast.success('리뷰가 등록되었습니다.')
      await Promise.all([fetchReviews(0), fetchStats(), findMyReview()])
    } catch {
      setSubmitError('예상치 못한 오류가 발생했습니다.')
      toast.error('리뷰 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStart = (review: ReviewWithUser) => {
    setEditingReviewId(review.id)
    setEditRating(review.rating)
    setEditComment(review.comment)
  }

  const handleEditCancel = () => {
    setEditingReviewId(null)
    setEditRating(0)
    setEditComment('')
  }

  const handleEditSave = async () => {
    if (!user || !editingReviewId) return

    const ratingResult = validateReviewRating(editRating)
    if (!ratingResult.isValid) return

    const commentResult = validateReviewComment(editComment)
    if (!commentResult.isValid) return

    setIsSubmitting(true)

    try {
      const { error } = await (supabase.rpc as any)('update_review', {
        p_reviewer_id: user.id,
        p_review_id: editingReviewId,
        p_rating: editRating,
        p_comment: editComment.trim(),
      })

      if (error) {
        console.error('Update review error:', error)
        toast.error('리뷰 수정에 실패했습니다.')
        return
      }

      setEditingReviewId(null)
      setPage(0)
      toast.success('리뷰가 수정되었습니다.')
      await Promise.all([fetchReviews(0), fetchStats(), findMyReview()])
    } catch {
      toast.error('리뷰 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!user) return

    setDeletingReviewId(reviewId)

    try {
      const { error } = await (supabase.rpc as any)('delete_review', {
        p_reviewer_id: user.id,
        p_review_id: reviewId,
      })

      if (error) {
        console.error('Delete review error:', error)
        toast.error('리뷰 삭제에 실패했습니다.')
        return
      }

      setMyReview(null)
      setDeletingReviewId(null)
      setPage(0)
      toast.success('리뷰가 삭제되었습니다.')
      await Promise.all([fetchReviews(0), fetchStats()])
    } catch {
      toast.error('리뷰 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingReviewId(null)
    }
  }

  const ratingDistribution = (() => {
    const dist = [0, 0, 0, 0, 0]
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++
    })
    return dist
  })()

  return (
    <div className="space-y-6">
      {/* 리뷰 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">
            리뷰 ({reviewCount})
          </h2>
        </div>
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} size="sm" />
            <span className="text-sm font-medium text-gray-700">
              {averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* 리뷰 통계 바 */}
      {reviewCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-6">
              <div className="text-center min-w-[80px]">
                <p className="text-3xl font-bold text-gray-800">
                  {averageRating.toFixed(1)}
                </p>
                <StarRating rating={averageRating} size="sm" className="justify-center mt-1" />
                <p className="text-xs text-gray-400 mt-1">{reviewCount}개 리뷰</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star - 1]
                  const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-gray-500">{star}</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-gray-400">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 리뷰 작성 폼 */}
      {canReview && (
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">리뷰 작성</h3>

            <div>
              <p className="text-xs text-gray-500 mb-2">평점을 선택해주세요</p>
              <StarRating
                rating={newRating}
                interactive
                onChange={setNewRating}
                size="lg"
                showValue
              />
              {formErrors.rating && (
                <p className="text-xs text-red-500 mt-1">{formErrors.rating}</p>
              )}
            </div>

            <div>
              <Textarea
                placeholder="이 프롬프트에 대한 솔직한 후기를 남겨주세요 (선택)"
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value)
                  if (formErrors.comment) {
                    setFormErrors((prev) => {
                      const next = { ...prev }
                      delete next.comment
                      return next
                    })
                  }
                }}
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                {formErrors.comment ? (
                  <p className="text-xs text-red-500">{formErrors.comment}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {newComment.length}/500
                </span>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg p-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || newRating === 0}
              className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  리뷰 등록
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 이미 리뷰 작성 완료 안내 */}
      {user && isPurchased && !isOwner && myReview && (
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 text-center">
          이미 리뷰를 작성하셨습니다. 아래에서 수정하거나 삭제할 수 있습니다.
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* 리뷰 목록 */}
      {!isLoading && reviews.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">아직 리뷰가 없습니다.</p>
          {isPurchased && !isOwner && !myReview && (
            <p className="text-xs text-gray-400 mt-1">
              첫 번째 리뷰를 남겨보세요!
            </p>
          )}
        </div>
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isMyReview = user?.id === review.reviewer_id
            const isEditing = editingReviewId === review.id
            const tierInfo = TIERS[review.reviewer.tier]

            return (
              <Card key={review.id} className={isMyReview ? 'border-primary/20 bg-violet-50/30' : ''}>
                <CardContent className="p-4">
                  {/* 리뷰 헤더 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={review.reviewer.avatar_url || undefined}
                          alt={review.reviewer.nickname}
                        />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                          {review.reviewer.nickname[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">
                            {review.reviewer.nickname}
                          </span>
                          <span className="text-xs">{tierInfo.badge}</span>
                          {isMyReview && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                              MY
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(review.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 수정/삭제 버튼 */}
                    {isMyReview && !isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditStart(review)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {deletingReviewId === review.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="text-[10px] text-red-500 hover:text-red-600 font-medium px-1"
                            >
                              확인
                            </button>
                            <button
                              onClick={() => setDeletingReviewId(null)}
                              className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingReviewId(review.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 리뷰 본문 or 수정 폼 */}
                  {isEditing ? (
                    <div className="ml-10 space-y-3">
                      <StarRating
                        rating={editRating}
                        interactive
                        onChange={setEditRating}
                        size="md"
                      />
                      <Textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        maxLength={500}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleEditSave}
                          disabled={isSubmitting || editRating === 0}
                          className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            '저장'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleEditCancel}
                          disabled={isSubmitting}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    review.comment && (
                      <p className="ml-10 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {review.comment}
                      </p>
                    )
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* 더 보기 */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className="w-full sm:w-auto"
              >
                리뷰 더 보기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

