/**
 * Supabase Database Types
 * 프로젝트의 모든 데이터베이스 스키마를 타입으로 정의
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      prompts: {
        Row: Prompt
        Insert: PromptInsert
        Update: PromptUpdate
      }
      purchases: {
        Row: Purchase
        Insert: PurchaseInsert
        Update: PurchaseUpdate
      }
    }
  }
}

// ============================================
// Users Table
// ============================================

export interface User {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  points: number // 현재 보유 포인트
  referral_code: string // 고유 추천인 코드
  referred_by: string | null // 추천인 코드 (nullable)
  tier: UserTier // 등급: BRONZE, SILVER, GOLD, PLATINUM
  total_sales: number // 총 판매 횟수
  total_purchases: number // 총 구매 횟수
  created_at: string
  updated_at: string
}

export interface UserInsert {
  id?: string
  email: string
  nickname: string
  avatar_url?: string | null
  points?: number // 기본값: 100
  referral_code: string
  referred_by?: string | null
  tier?: UserTier // 기본값: BRONZE
  total_sales?: number // 기본값: 0
  total_purchases?: number // 기본값: 0
  created_at?: string
  updated_at?: string
}

export interface UserUpdate {
  email?: string
  nickname?: string
  avatar_url?: string | null
  points?: number
  tier?: UserTier
  total_sales?: number
  total_purchases?: number
  updated_at?: string
}

export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

// ============================================
// Prompts Table
// ============================================

export interface Prompt {
  id: string
  seller_id: string // users.id FK
  title: string
  description: string
  content: string // 실제 프롬프트 내용 (구매 전 비공개)
  preview: string // 미리보기 텍스트
  category: PromptCategory
  price: number // 포인트 가격
  tags: string[] // 검색용 태그 배열
  thumbnail_url: string | null
  view_count: number // 조회수
  purchase_count: number // 판매 횟수
  rating_avg: number // 평균 평점 (향후 확장)
  status: PromptStatus // ACTIVE, SOLD_OUT, DELETED
  created_at: string
  updated_at: string
}

export interface PromptInsert {
  id?: string
  seller_id: string
  title: string
  description: string
  content: string
  preview: string
  category: PromptCategory
  price: number
  tags?: string[]
  thumbnail_url?: string | null
  view_count?: number // 기본값: 0
  purchase_count?: number // 기본값: 0
  rating_avg?: number // 기본값: 0
  status?: PromptStatus // 기본값: ACTIVE
  created_at?: string
  updated_at?: string
}

export interface PromptUpdate {
  title?: string
  description?: string
  content?: string
  preview?: string
  category?: PromptCategory
  price?: number
  tags?: string[]
  thumbnail_url?: string | null
  view_count?: number
  purchase_count?: number
  rating_avg?: number
  status?: PromptStatus
  updated_at?: string
}

export type PromptCategory =
  | 'WRITING' // 글쓰기
  | 'CODING' // 코딩
  | 'DESIGN' // 디자인
  | 'MARKETING' // 마케팅
  | 'EDUCATION' // 교육
  | 'ENTERTAINMENT' // 엔터테인먼트
  | 'ETC' // 기타

export type PromptStatus = 'ACTIVE' | 'SOLD_OUT' | 'DELETED'

// ============================================
// Purchases Table
// ============================================

export interface Purchase {
  id: string
  buyer_id: string // users.id FK
  seller_id: string // users.id FK
  prompt_id: string // prompts.id FK
  price_paid: number // 구매 당시 가격 (가격 변동 대비)
  created_at: string
}

export interface PurchaseInsert {
  id?: string
  buyer_id: string
  seller_id: string
  prompt_id: string
  price_paid: number
  created_at?: string
}

export interface PurchaseUpdate {
  // Purchase는 생성 후 수정 불가 (Immutable)
}

// ============================================
// Helper Types
// ============================================

/**
 * Prompt with Seller Info (JOIN 결과)
 */
export interface PromptWithSeller extends Prompt {
  seller: {
    id: string
    nickname: string
    avatar_url: string | null
    tier: UserTier
  }
}

/**
 * Purchase with Details (JOIN 결과)
 */
export interface PurchaseWithDetails extends Purchase {
  prompt: {
    id: string
    title: string
    thumbnail_url: string | null
  }
  seller: {
    id: string
    nickname: string
  }
}
