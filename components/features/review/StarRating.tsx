'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
  showValue?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating

  const handleClick = (starIndex: number) => {
    if (!interactive || !onChange) return
    onChange(starIndex)
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starIndex = i + 1
        const isFilled = starIndex <= Math.floor(displayRating)
        const isHalf = !isFilled && starIndex <= displayRating + 0.5 && starIndex > Math.floor(displayRating)

        return (
          <button
            key={starIndex}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => interactive && setHoverRating(starIndex)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={cn(
              'p-0 border-0 bg-transparent',
              interactive && 'cursor-pointer transition-transform hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                SIZE_MAP[size],
                'transition-colors',
                isFilled && 'fill-amber-400 text-amber-400',
                isHalf && 'fill-amber-400/50 text-amber-400',
                !isFilled && !isHalf && (interactive ? 'text-gray-300 hover:text-amber-300' : 'text-gray-200')
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className={cn(
          'ml-1 font-medium text-gray-700',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
        )}>
          {rating > 0 ? rating.toFixed(1) : '-'}
        </span>
      )}
    </div>
  )
}
