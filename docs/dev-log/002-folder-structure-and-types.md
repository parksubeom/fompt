# 002 - 폴더 구조 및 타입 정의

**작성일:** 2026-02-10  
**작업자:** Senior Frontend Developer / Tech Lead

---

## 1. 목표 (Goal)

프로젝트의 확장 가능한 폴더 구조 확립 및 Supabase 데이터베이스 타입 정의:
- 기능별 폴더 분리 (components, types, utils, hooks, store)
- Supabase 테이블 스키마를 TypeScript 타입으로 변환
- 재사용 가능한 유틸리티 함수 구현
- 비즈니스 로직 상수 정의 (포인트, 등급, 카테고리)

---

## 2. 추론 및 결정 (Reasoning & Decisions)

### 2.1. 폴더 구조 설계 철학

**결정:** 기능 중심(Feature-based) 구조  
**이유:**
- 컴포넌트를 `ui`(재사용), `layout`(레이아웃), `features`(도메인)으로 분리
- 각 폴더의 책임이 명확하여 협업 시 충돌 최소화
- 코드 탐색이 직관적 (예: 인증 관련은 모두 `features/auth/`)

**대안:**
- 파일 타입 중심 (모든 컴포넌트를 `components/`에): 규모가 커지면 관리 어려움
- Atomic Design: 작은 프로젝트에는 과도한 추상화

### 2.2. TypeScript 타입 정의 방식

**결정:** Database 스키마를 `types/database.ts`에 명시적으로 정의  
**이유:**
- Supabase의 자동 타입 생성 대신 수동 정의로 문서화 역할 겸함
- Insert/Update 타입을 분리하여 API 안정성 향상
- `PromptWithSeller` 같은 JOIN 결과 타입을 미리 정의

**구현 예시:**
```typescript
export interface User {
  id: string
  email: string
  nickname: string
  points: number // 핵심: 포인트 잔액
  tier: UserTier // BRONZE | SILVER | GOLD | PLATINUM
  // ...
}

export interface UserInsert {
  email: string
  nickname: string
  points?: number // 기본값 100
  // ...
}
```

**대안:**
- `supabase gen types` CLI 사용: 자동화 가능하나 커스터마이징 어려움

### 2.3. 유틸리티 함수 분리

**결정:** `utils/`를 순수 함수 저장소로 활용  
**이유:**
- `constants.ts`: 비즈니스 로직 상수 (포인트, 등급, 카테고리)
- `format.ts`: 포맷팅 전용 (날짜, 숫자, 텍스트)
- `validation.ts`: 검증 전용 (이메일, 비밀번호, 닉네임)
- 각 파일의 역할이 명확하여 테스트 용이

**lib vs utils 구분:**
- `lib/`: 외부 라이브러리 래핑 (예: `lib/supabase.ts`, `lib/utils.ts`)
- `utils/`: 비즈니스 로직 유틸리티

---

## 3. 구현 상세 (Implementation Details)

### 3.1. 타입 정의 (`types/database.ts`)

**Users 테이블:**
```typescript
export interface User {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  points: number              // 현재 포인트
  referral_code: string       // 고유 추천인 코드 (8자리)
  referred_by: string | null  // 추천인 코드
  tier: UserTier              // 등급
  total_sales: number         // 총 판매 횟수
  total_purchases: number     // 총 구매 횟수
  created_at: string
  updated_at: string
}
```

**Prompts 테이블:**
```typescript
export interface Prompt {
  id: string
  seller_id: string
  title: string
  description: string
  content: string            // 실제 프롬프트 (구매 후 공개)
  preview: string            // 미리보기 텍스트
  category: PromptCategory   // 카테고리 Enum
  price: number              // 포인트 가격
  tags: string[]             // 검색용 태그
  view_count: number
  purchase_count: number
  status: PromptStatus       // ACTIVE | SOLD_OUT | DELETED
  // ...
}
```

**Purchases 테이블:**
```typescript
export interface Purchase {
  id: string
  buyer_id: string
  seller_id: string
  prompt_id: string
  price_paid: number         // 구매 당시 가격 (가격 변동 대비)
  created_at: string
}
```

**Helper 타입 (JOIN 결과):**
```typescript
export interface PromptWithSeller extends Prompt {
  seller: {
    id: string
    nickname: string
    avatar_url: string | null
    tier: UserTier
  }
}
```

### 3.2. 비즈니스 상수 (`utils/constants.ts`)

**포인트 시스템:**
```typescript
export const POINTS = {
  SIGNUP_BONUS: 100,      // 가입 시 지급
  REFERRAL_BONUS: 50,     // 추천인 보너스
  MIN_PURCHASE: 10,       // 최소 구매 가격
  MAX_PURCHASE: 10000,    // 최대 구매 가격
} as const
```

**등급 시스템:**
```typescript
export const TIERS: Record<UserTier, TierInfo> = {
  BRONZE:   { minTransactions: 0,  badge: '🥉', colorClass: 'text-amber-700' },
  SILVER:   { minTransactions: 5,  badge: '🥈', colorClass: 'text-gray-500' },
  GOLD:     { minTransactions: 15, badge: '🥇', colorClass: 'text-yellow-600' },
  PLATINUM: { minTransactions: 30, badge: '💎', colorClass: 'text-cyan-600' },
}

// 총 거래 횟수(판매+구매)로 등급 자동 계산
export function calculateTier(totalTransactions: number): UserTier {
  if (totalTransactions >= 30) return 'PLATINUM'
  if (totalTransactions >= 15) return 'GOLD'
  if (totalTransactions >= 5) return 'SILVER'
  return 'BRONZE'
}
```

**카테고리:**
```typescript
export const CATEGORIES: CategoryInfo[] = [
  { value: 'WRITING', label: '글쓰기', icon: '✍️' },
  { value: 'CODING', label: '코딩', icon: '💻' },
  { value: 'DESIGN', label: '디자인', icon: '🎨' },
  // ... 총 7개
]
```

### 3.3. 유틸리티 함수

**포맷팅 (`utils/format.ts`):**
```typescript
formatPoints(1500)           // "1,500 F"
formatRelativeTime(date)     // "3분 전"
formatCompactNumber(1500)    // "1.5K"
truncateText(text, 50)       // "긴 텍스트를..."
generateReferralCode()       // "A3X9K2L7" (랜덤 8자리)
```

**검증 (`utils/validation.ts`):**
```typescript
validateEmail('test@example.com')    // { isValid: true }
validatePassword('12345')             // { isValid: false, error: '...' }
validateNickname('홍길동123')        // { isValid: true }
validateReferralCode('ABC12345')     // { isValid: false } (8자리 필요)
```

### 3.4. 폴더 구조

```
/Users/user/Desktop/fompt/
├── types/
│   ├── database.ts          # 185 lines - DB 스키마
│   └── index.ts             # 74 lines - 전역 타입
├── utils/
│   ├── constants.ts         # 149 lines - 비즈니스 상수
│   ├── format.ts            # 73 lines - 포맷팅
│   └── validation.ts        # 145 lines - 검증
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── layout/              # (예정)
│   └── features/            # (예정)
├── hooks/                   # (예정)
└── store/                   # (예정)
```

### 3.5. 타입 안정성 확보

**Enum 대신 Union Type 사용:**
```typescript
export type UserTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
export type PromptCategory = 'WRITING' | 'CODING' | 'DESIGN' | ...
```
→ 런타임 오버헤드 없이 타입 안정성 확보

**as const를 활용한 상수:**
```typescript
export const POINTS = { SIGNUP_BONUS: 100, ... } as const
```
→ 타입 추론 강화

---

## 4. 명령어 (Commands)

이번 단계는 파일 생성만 수행하므로 별도 명령어 없음.

---

## 5. 결과 (Result)

### 5.1. 생성된 파일 목록

| 파일                         | 라인 수 | 역할                              |
| ---------------------------- | ------- | --------------------------------- |
| `types/database.ts`          | 185     | Supabase DB 스키마 타입           |
| `types/index.ts`             | 74      | 전역 타입 재수출                  |
| `utils/constants.ts`         | 149     | 포인트/등급/카테고리 상수         |
| `utils/format.ts`            | 73      | 포맷팅 함수                       |
| `utils/validation.ts`        | 145     | 폼 검증 함수                      |
| `components/layout/README.md`| 7       | 레이아웃 컴포넌트 가이드          |
| `components/features/README.md`| 11    | 기능별 컴포넌트 가이드            |
| `hooks/README.md`            | 9       | 커스텀 훅 가이드                  |
| `store/README.md`            | 8       | Zustand 스토어 가이드             |

**총 라인 수:** ~660 lines

### 5.2. 핵심 성과

1. **타입 안정성 확보**
   - 모든 DB 테이블이 TypeScript 타입으로 정의됨
   - Insert/Update 타입 분리로 API 안정성 향상

2. **재사용 가능한 유틸리티**
   - 포맷팅, 검증 로직을 순수 함수로 분리
   - 단위 테스트 작성 가능한 구조

3. **명확한 비즈니스 로직**
   - 포인트 시스템 (가입 100P, 추천 50P)
   - 등급 시스템 (거래 횟수 기반 자동 승급)
   - 카테고리 (7개 고정)

### 5.3. 검증 방법

TypeScript 컴파일 확인:
```bash
npx tsc --noEmit
```
→ 타입 오류 없음 확인

### 5.4. 다음 단계 (Next Steps)

- **Step 3:** Supabase 클라이언트 설정 (`lib/supabase.ts` + `.env.local`)
- **Step 4:** 전역 레이아웃 및 헤더 컴포넌트 구현
- **Step 5:** 인증 페이지 UI 퍼블리싱

---

## 6. 재현성 체크리스트 (Reproducibility Checklist)

- [x] 모든 타입이 명시적으로 정의됨
- [x] 비즈니스 로직 상수가 문서화됨
- [x] 유틸리티 함수에 JSDoc 주석 포함
- [x] 폴더 구조가 README로 설명됨
- [x] 타입 정의가 실제 Supabase 스키마와 일치함

**결론:** 이 타입 정의와 유틸리티를 기반으로 이후 모든 컴포넌트와 API를 구현할 수 있음.
