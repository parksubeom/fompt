/**
 * Global Type Exports
 * 프로젝트 전역에서 사용되는 타입 재수출
 */

export * from './database'

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// ============================================
// Auth Types
// ============================================

export interface SignupData {
  email: string
  password: string
  nickname: string
  referralCode?: string // 추천인 코드 (선택)
}

export interface LoginData {
  email: string
  password: string
}

// ============================================
// Point Transaction Types
// ============================================

export type PointTransactionType =
  | 'SIGNUP' // 가입 보너스 +100
  | 'PURCHASE' // 프롬프트 구매 (차감)
  | 'SALE' // 프롬프트 판매 (증가)
  | 'REFERRAL' // 추천인 보너스

export interface PointTransaction {
  userId: string
  type: PointTransactionType
  amount: number // 양수: 증가, 음수: 차감
  description: string
  relatedId?: string // 관련 Purchase ID 등
}

// ============================================
// Tier Criteria
// ============================================

export interface TierCriteria {
  tier: import('./database').UserTier
  minTransactions: number // 최소 거래 횟수 (판매 + 구매)
  badge: string // 뱃지 이모지
  color: string // Tailwind 색상 클래스
}

export const TIER_CRITERIA: TierCriteria[] = [
  { tier: 'BRONZE', minTransactions: 0, badge: '🥉', color: 'text-amber-600' },
  { tier: 'SILVER', minTransactions: 5, badge: '🥈', color: 'text-gray-400' },
  { tier: 'GOLD', minTransactions: 15, badge: '🥇', color: 'text-yellow-500' },
  { tier: 'PLATINUM', minTransactions: 30, badge: '💎', color: 'text-cyan-400' },
]

// ============================================
// Prompt Filter Types
// ============================================

export interface PromptFilters {
  category?: import('./database').PromptCategory
  minPrice?: number
  maxPrice?: number
  sortBy?: 'latest' | 'popular' | 'price_asc' | 'price_desc'
  search?: string
}
