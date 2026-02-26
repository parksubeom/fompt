'use client'

import Link from 'next/link'
import { Eye, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CATEGORIES, TIERS } from '@/utils/constants'
import { formatPoints, formatRelativeTime, formatCompactNumber } from '@/utils/format'
import { ROUTES } from '@/utils/constants'
import type { PromptWithSeller } from '@/types/database'

interface PromptCardProps {
  prompt: PromptWithSeller
}

export function PromptCard({ prompt }: PromptCardProps) {
  const category = CATEGORIES.find((c) => c.value === prompt.category)
  const tierInfo = TIERS[prompt.seller.tier]

  return (
    <Link href={ROUTES.PROMPT_DETAIL(prompt.id)}>
      <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
        {/* 상단: 카테고리 + 가격 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          {category && (
            <Badge variant="secondary" className="text-xs">
              {category.icon} {category.label}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="text-primary border-primary/30 font-semibold"
          >
            {formatPoints(prompt.price)}
          </Badge>
        </div>

        <CardContent className="px-5 pb-3 space-y-2">
          {/* 제목 */}
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
            {prompt.title}
          </h3>

          {/* 설명 */}
          <p className="text-sm text-gray-500 line-clamp-2">
            {prompt.description}
          </p>

          {/* 태그 */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {prompt.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-400 bg-gray-50 rounded px-1.5 py-0.5"
                >
                  #{tag}
                </span>
              ))}
              {prompt.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{prompt.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="px-5 pb-4 pt-0 flex items-center justify-between">
          {/* 판매자 정보 */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={prompt.seller.avatar_url || undefined}
                alt={prompt.seller.nickname}
              />
              <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                {prompt.seller.nickname[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600">
              {prompt.seller.nickname}
            </span>
            <span className="text-xs">{tierInfo.badge}</span>
          </div>

          {/* 조회수 & 판매수 */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatCompactNumber(prompt.view_count)}
            </span>
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              {formatCompactNumber(prompt.purchase_count)}
            </span>
          </div>
        </CardFooter>

        {/* 하단 시간 */}
        <div className="px-5 pb-3 pt-0">
          <span className="text-xs text-gray-300">
            {formatRelativeTime(prompt.created_at)}
          </span>
        </div>
      </Card>
    </Link>
  )
}
