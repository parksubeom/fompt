# 003 - Supabase 클라이언트 설정

**작성일:** 2026-02-10  
**작업자:** Senior Frontend Developer / Tech Lead

---

## 1. 목표 (Goal)

Supabase 백엔드 연동을 위한 클라이언트 설정:
- 클라이언트/서버 환경별 Supabase 클라이언트 생성
- 환경변수 설정 가이드 제공
- Next.js Middleware를 통한 인증 상태 관리
- Singleton 패턴으로 클라이언트 인스턴스 재사용

---

## 2. 추론 및 결정 (Reasoning & Decisions)

### 2.1. 클라이언트 분리 전략

**결정:** 3개의 Supabase 클라이언트 파일 생성  
**이유:**

1. **`lib/supabase.ts`** (Client Component용)
   - 브라우저에서 실행되는 클라이언트 컴포넌트에서 사용
   - Singleton 패턴으로 인스턴스 재사용
   - 로컬스토리지를 통한 세션 지속

2. **`lib/supabase-server.ts`** (Server Component용)
   - 서버 사이드 렌더링 시 사용
   - 쿠키를 통해 인증 상태 유지
   - `@supabase/ssr` 패키지 활용

3. **`lib/supabase-middleware.ts`** (Middleware용)
   - 라우트 접근 전 인증 체크
   - 세션 자동 갱신
   - 보호된 라우트 리다이렉트

**대안:**
- 단일 클라이언트 사용: 서버/클라이언트 환경 차이로 인한 에러 발생
- Context API로 클라이언트 전달: 보일러플레이트 증가

### 2.2. Singleton 패턴 선택

**결정:** `getSupabase()` 함수로 인스턴스 재사용  
**이유:**
- 불필요한 클라이언트 재생성 방지
- 메모리 효율성
- 연결 풀 재사용

**구현:**
```typescript
let supabaseInstance: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,        // 세션 지속
        autoRefreshToken: true,       // 자동 토큰 갱신
        detectSessionInUrl: true,     // URL에서 세션 감지
      },
    })
  }
  return supabaseInstance
}
```

### 2.3. 환경변수 관리

**결정:** `.env.local`에 Supabase URL과 Anon Key 저장  
**이유:**
- `NEXT_PUBLIC_` 접두사로 클라이언트 접근 허용
- `.gitignore`에 포함되어 보안 유지
- `.env.local.example`로 설정 가이드 제공

**보안 고려사항:**
- Anon Key는 공개되어도 안전 (Row Level Security로 보호)
- Service Role Key는 **절대 클라이언트에 노출하지 않음**

### 2.4. Middleware를 통한 인증 보호

**결정:** Next.js Middleware에서 세션 갱신 및 라우트 보호  
**이유:**
- 모든 요청마다 세션 자동 갱신 (만료 방지)
- 보호된 라우트 접근 시 자동 로그인 페이지 리다이렉트
- 서버 사이드에서 인증 체크 (클라이언트보다 안전)

**보호 대상 라우트:**
```typescript
const protectedRoutes = [
  '/profile',        // 프로필 페이지
  '/prompts/create', // 프롬프트 등록
  '/purchases',      // 구매 내역
  '/settings',       // 설정
]
```

---

## 3. 구현 상세 (Implementation Details)

### 3.1. 파일 구조

```
lib/
├── supabase.ts              # Client Component용
├── supabase-server.ts       # Server Component용
└── supabase-middleware.ts   # Middleware용

middleware.ts                # Next.js Middleware 진입점

.env.local.example           # 환경변수 템플릿
.env.local                   # 실제 환경변수 (Git 제외)
```

### 3.2. Client Component용 클라이언트 (`lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 환경변수 누락 시 즉시 에러 발생
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
}

let supabaseInstance: SupabaseClient<Database> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

export const supabase = getSupabase()
```

**사용 예시:**
```typescript
'use client'
import { supabase } from '@/lib/supabase'

async function fetchPrompts() {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('status', 'ACTIVE')
}
```

### 3.3. Server Component용 클라이언트 (`lib/supabase-server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**사용 예시:**
```typescript
// app/prompts/page.tsx (Server Component)
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function PromptsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: prompts } = await supabase.from('prompts').select('*')

  return <div>{/* Render prompts */}</div>
}
```

### 3.4. Middleware 설정 (`middleware.ts`)

```typescript
import { updateSession } from '@/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**동작 흐름:**
1. 모든 요청이 Middleware를 거침
2. Supabase 세션 갱신 (만료 방지)
3. 보호된 라우트 접근 시 인증 체크
4. 로그인 안 된 경우 `/auth/login?redirect=/original-path`로 리다이렉트

### 3.5. 환경변수 설정

**`.env.local.example` (템플릿):**
```bash
# Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**실제 설정 방법:**
1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택 > Settings > API
3. 'Project URL'과 'anon public' 키 복사
4. `.env.local.example`을 `.env.local`로 복사
5. 실제 값으로 교체

---

## 4. 명령어 (Commands)

### 4.1. 패키지 설치

```bash
# Supabase SSR 패키지 설치
npm install @supabase/ssr

# 이미 설치된 패키지 (Step 1에서 설치)
# npm install @supabase/supabase-js
```

### 4.2. 환경변수 설정

```bash
# .env.local 파일 생성
cp .env.local.example .env.local

# 에디터로 열어서 실제 값 입력
# NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY 수정
```

### 4.3. 타입 체크

```bash
# TypeScript 타입 오류 확인
npx tsc --noEmit
```

---

## 5. 결과 (Result)

### 5.1. 생성된 파일

| 파일                         | 라인 수 | 역할                              |
| ---------------------------- | ------- | --------------------------------- |
| `lib/supabase.ts`            | 42      | Client Component용 클라이언트     |
| `lib/supabase-server.ts`     | 36      | Server Component용 클라이언트     |
| `lib/supabase-middleware.ts` | 62      | Middleware용 클라이언트           |
| `middleware.ts`              | 20      | Next.js Middleware 진입점         |
| `.env.local.example`         | 20      | 환경변수 템플릿                   |
| `.env.local`                 | 6       | 실제 환경변수 (Git 제외)          |

### 5.2. 설치된 패키지

| 패키지               | 버전    | 용도                          |
| -------------------- | ------- | ----------------------------- |
| @supabase/supabase-js| latest  | 기본 Supabase 클라이언트      |
| @supabase/ssr        | latest  | SSR 환경 쿠키 핸들링          |

### 5.3. 핵심 성과

1. **환경별 클라이언트 분리**
   - Client Component, Server Component, Middleware 각각 최적화된 클라이언트

2. **Singleton 패턴**
   - 클라이언트 인스턴스 재사용으로 성능 향상

3. **자동 인증 보호**
   - Middleware가 보호된 라우트 접근 자동 제어
   - 세션 자동 갱신으로 사용자 경험 개선

4. **타입 안정성**
   - `Database` 타입을 모든 클라이언트에 적용
   - 쿼리 결과 자동 타입 추론

### 5.4. 검증 방법

```bash
# 1. 개발 서버 재시작 (환경변수 로드)
npm run dev

# 2. 브라우저에서 접속
# http://localhost:3000 → 정상 작동
# http://localhost:3000/profile → /auth/login으로 리다이렉트 (인증 필요)
```

### 5.5. 다음 단계 (Next Steps)

- **Step 4:** 전역 레이아웃 및 헤더 컴포넌트 구현
  - 로고 클릭 시 홈 이동
  - 로그인 상태: 포인트 뱃지, 프로필 드롭다운
  - 비로그인 상태: "시작하기" 버튼

- **Step 5:** 인증 페이지 UI 퍼블리싱
  - `/auth/login` - 로그인 폼
  - `/auth/signup` - 회원가입 폼 (추천인 코드 입력)

---

## 6. 재현성 체크리스트 (Reproducibility Checklist)

- [x] 모든 Supabase 클라이언트 파일 생성
- [x] 환경변수 템플릿 제공 (`.env.local.example`)
- [x] Middleware 설정 완료
- [x] 패키지 설치 명령어 문서화
- [x] 보호된 라우트 정의
- [x] 타입 안정성 확보 (`Database` 타입 적용)

**결론:** Supabase 클라이언트 설정 완료. 이제 인증 및 데이터베이스 쿼리를 수행할 준비가 되었습니다.

---

## 7. 추가 참고사항

### 7.1. Row Level Security (RLS) 정책

Supabase에서 다음 RLS 정책을 적용해야 합니다 (데이터베이스 설정 시):

**Users 테이블:**
- SELECT: 모든 사용자가 다른 사용자의 공개 정보 조회 가능
- INSERT: 인증된 사용자만 본인 레코드 생성
- UPDATE: 본인 레코드만 수정 가능

**Prompts 테이블:**
- SELECT (title, description, preview): 모든 사용자 조회 가능
- SELECT (content): 구매한 사용자 또는 판매자만 조회 가능
- INSERT: 인증된 사용자만 생성 가능
- UPDATE: 판매자만 수정 가능

**Purchases 테이블:**
- SELECT: 구매자 또는 판매자만 조회 가능
- INSERT: 인증된 사용자만 생성 가능
- UPDATE/DELETE: 불가 (Immutable)

### 7.2. 트러블슈팅

**문제:** `Error: Supabase 환경변수가 설정되지 않았습니다.`  
**해결:** `.env.local` 파일 생성 및 값 입력 후 서버 재시작

**문제:** Middleware에서 무한 리다이렉트  
**해결:** `/auth/login` 경로가 `protectedRoutes`에 포함되지 않았는지 확인

**문제:** 쿠키가 설정되지 않음  
**해결:** `@supabase/ssr` 패키지 설치 확인
