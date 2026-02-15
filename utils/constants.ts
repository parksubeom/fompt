/**
 * Application Constants
 * 앱 전역에서 사용되는 상수 정의
 */

import type { PromptCategory, UserTier } from '@/types'

// ============================================
// Points System
// ============================================

export const POINTS = {
  SIGNUP_BONUS: 100, // 가입 시 지급
  REFERRAL_BONUS: 50, // 추천인 보너스 (추천인/피추천인 각각)
  MIN_PURCHASE: 10, // 최소 구매 가격
  MAX_PURCHASE: 10000, // 최대 구매 가격
} as const

// ============================================
// Tier System
// ============================================

export interface TierInfo {
  tier: UserTier
  label: string
  minTransactions: number
  badge: string
  colorClass: string
  bgClass: string
}

export const TIERS: Record<UserTier, TierInfo> = {
  BRONZE: {
    tier: 'BRONZE',
    label: '브론즈',
    minTransactions: 0,
    badge: '🥉',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
  },
  SILVER: {
    tier: 'SILVER',
    label: '실버',
    minTransactions: 5,
    badge: '🥈',
    colorClass: 'text-gray-500',
    bgClass: 'bg-gray-50',
  },
  GOLD: {
    tier: 'GOLD',
    label: '골드',
    minTransactions: 15,
    badge: '🥇',
    colorClass: 'text-yellow-600',
    bgClass: 'bg-yellow-50',
  },
  PLATINUM: {
    tier: 'PLATINUM',
    label: '플래티넘',
    minTransactions: 30,
    badge: '💎',
    colorClass: 'text-cyan-600',
    bgClass: 'bg-cyan-50',
  },
}

/**
 * 총 거래 횟수(판매+구매)를 기반으로 등급 계산
 */
export function calculateTier(totalTransactions: number): UserTier {
  if (totalTransactions >= TIERS.PLATINUM.minTransactions) return 'PLATINUM'
  if (totalTransactions >= TIERS.GOLD.minTransactions) return 'GOLD'
  if (totalTransactions >= TIERS.SILVER.minTransactions) return 'SILVER'
  return 'BRONZE'
}

// ============================================
// Categories
// ============================================

export interface CategoryInfo {
  value: PromptCategory
  label: string
  icon: string
  description: string
}

export const CATEGORIES: CategoryInfo[] = [
  {
    value: 'WRITING',
    label: '글쓰기',
    icon: '✍️',
    description: '블로그, 소설, 시나리오 등',
  },
  {
    value: 'CODING',
    label: '코딩',
    icon: '💻',
    description: '프로그래밍, 디버깅, 리팩토링',
  },
  {
    value: 'DESIGN',
    label: '디자인',
    icon: '🎨',
    description: 'UI/UX, 그래픽, 로고',
  },
  {
    value: 'MARKETING',
    label: '마케팅',
    icon: '📢',
    description: '광고 카피, SNS 콘텐츠',
  },
  {
    value: 'EDUCATION',
    label: '교육',
    icon: '📚',
    description: '강의 자료, 학습 계획',
  },
  {
    value: 'ENTERTAINMENT',
    label: '엔터테인먼트',
    icon: '🎭',
    description: '게임, 영상, 음악',
  },
  {
    value: 'ETC',
    label: '기타',
    icon: '📦',
    description: '기타 카테고리',
  },
]

// ============================================
// Validation Rules
// ============================================

export const VALIDATION = {
  NICKNAME: {
    MIN: 2,
    MAX: 20,
    PATTERN: /^[가-힣a-zA-Z0-9_]+$/, // 한글, 영문, 숫자, 언더스코어
  },
  PASSWORD: {
    MIN: 8,
    MAX: 50,
  },
  PROMPT: {
    TITLE: { MIN: 5, MAX: 100 },
    DESCRIPTION: { MIN: 10, MAX: 500 },
    CONTENT: { MIN: 20, MAX: 5000 },
    PREVIEW: { MIN: 10, MAX: 200 },
  },
  REFERRAL_CODE: {
    LENGTH: 8,
    PATTERN: /^[A-Z0-9]{8}$/, // 8자리 대문자+숫자
  },
} as const

// ============================================
// Routes
// ============================================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  AUTH_CALLBACK: '/auth/callback',
  PROFILE: '/profile',
  PROMPTS: '/prompts',
  PROMPT_DETAIL: (id: string) => `/prompts/${id}`,
  PROMPT_CREATE: '/prompts/create',
  PURCHASES: '/purchases',
  SETTINGS: '/settings',
} as const
