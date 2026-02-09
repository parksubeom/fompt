# 004 - 전역 레이아웃 및 헤더

**작성일:** 2026-02-10  
**작업자:** Senior Frontend Developer / Tech Lead

---

## 1. 목표 (Goal)

사용자 경험의 기반이 되는 전역 레이아웃 구축:
- 헤더 컴포넌트 구현 (로고, 네비게이션, 인증 상태별 UI)
- 푸터 컴포넌트 구현 (빠른 링크, 고객 지원)
- 홈 페이지 Hero Section 및 Features 섹션 디자인
- 반응형 디자인 (모바일 ~ 데스크톱)

---

## 2. 추론 및 결정 (Reasoning & Decisions)

### 2.1. 헤더 구조 설계

**결정:** 3단 레이아웃 (로고 - 네비게이션 - 사용자 정보)  
**이유:**
- **왼쪽:** 로고 (홈으로 이동)
- **중앙:** 네비게이션 메뉴 (데스크톱만 표시)
- **오른쪽:** 포인트 뱃지 + 프로필 드롭다운 (로그인 시) / 시작하기 버튼 (비로그인 시)

**로그인 상태별 UI 차별화:**
```typescript
{user ? (
  <>
    <Badge>{formatPoints(user.points)}</Badge>
    <DropdownMenu>
      <Avatar>{user.nickname[0]}</Avatar>
    </DropdownMenu>
  </>
) : (
  <>
    <Button>로그인</Button>
    <Button>시작하기</Button>
  </>
)}
```

**대안:**
- 햄버거 메뉴로 모든 것 숨기기: 데스크톱에서 비효율적
- 상단 고정 안 함: 스크롤 시 네비게이션 접근성 저하

### 2.2. Sticky Header 선택

**결정:** `sticky top-0` + `backdrop-blur-sm`  
**이유:**
- 스크롤해도 헤더가 항상 보임 (네비게이션 접근성)
- Backdrop Blur로 콘텐츠와 구분되는 시각적 효과
- `z-50`으로 다른 요소 위에 표시

### 2.3. 포인트 뱃지 디자인

**결정:** 그라데이션 배경 + "F" 단위 표시  
**이유:**
- FOMPT의 브랜드 색상(Violet → Cyan) 강조
- "F" 단위로 포인트임을 명확히 표시 (예: "1,500 F")
- `formatPoints()` 유틸리티 함수로 일관된 포맷팅

**구현:**
```typescript
<Badge className="bg-gradient-to-r from-violet-50 to-cyan-50 text-primary">
  {formatPoints(user.points)} {/* "1,500 F" */}
</Badge>
```

### 2.4. 프로필 드롭다운 메뉴

**결정:** shadcn/ui DropdownMenu 사용  
**이유:**
- 접근성(a11y) 보장 (키보드 네비게이션, 포커스 관리)
- 등급 뱃지를 아바타 우측 하단에 표시 (시각적 재미)
- 주요 액션을 메뉴에 집중 (프로필, 구매 내역, 설정, 로그아웃)

**메뉴 구성:**
1. 사용자 정보 (닉네임, 이메일, 등급, 포인트)
2. 구분선
3. 액션 메뉴 (프로필, 구매 내역, 프롬프트 등록, 설정)
4. 구분선
5. 로그아웃 (빨간색으로 강조)

### 2.5. 반응형 전략

**결정:** Tailwind의 Breakpoint 활용  
**구현:**

- **데스크톱 (md 이상):**
  - 중앙 네비게이션 표시
  - 포인트 뱃지 표시
  - 풀 사이즈 버튼

- **모바일 (sm 이하):**
  - 중앙 네비게이션 숨김
  - 하단에 고정 탭 바 표시 (둘러보기, 판매하기, 포인트)
  - 포인트 뱃지 숨기고 탭 바에 표시

**모바일 탭 바 구현:**
```typescript
<div className="md:hidden border-t bg-white">
  <Link href="/prompts">둘러보기</Link>
  <Link href="/prompts/create">판매하기</Link>
  <div>💰 {formatPoints(user.points)}</div>
</div>
```

### 2.6. 홈 페이지 구성

**결정:** Hero + Features + CTA 섹션  
**이유:**
- **Hero:** 메인 메시지 + CTA 버튼 (시작하기, 둘러보기)
- **Features:** 핵심 가치 3가지 (포인트 거래, 등급 시스템, 안전한 커뮤니티)
- **CTA:** 재방문 유도 (100 포인트 강조)

**시각적 요소:**
- 로고는 항상 그라데이션 (Violet → Cyan)
- 버튼도 같은 그라데이션 적용 (브랜드 일관성)
- 아이콘은 lucide-react 사용

---

## 3. 구현 상세 (Implementation Details)

### 3.1. 파일 구조

```
components/layout/
├── Header.tsx        # 전역 헤더
└── Footer.tsx        # 전역 푸터

app/
├── layout.tsx        # 루트 레이아웃 (Header + Footer 포함)
└── page.tsx          # 홈 페이지 (Hero + Features + CTA)
```

### 3.2. Header 컴포넌트 (`components/layout/Header.tsx`)

**Props:**
```typescript
interface HeaderProps {
  user: User | null        // 현재 로그인 사용자
  onLogout?: () => void    // 로그아웃 핸들러
}
```

**주요 기능:**

1. **로고 클릭 시 홈 이동:**
```typescript
<Link href={ROUTES.HOME}>
  <h1 className="text-2xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
    FOMPT
  </h1>
</Link>
```

2. **포인트 뱃지:**
```typescript
<Badge className="bg-gradient-to-r from-violet-50 to-cyan-50 text-primary">
  {formatPoints(user.points)}
</Badge>
```

3. **아바타 + 등급 뱃지:**
```typescript
<Avatar>
  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500">
    {user.nickname[0].toUpperCase()}
  </AvatarFallback>
</Avatar>
<span className="absolute -bottom-1 -right-1">
  {TIERS[user.tier].badge} {/* 🥉🥈🥇💎 */}
</span>
```

4. **드롭다운 메뉴:**
- 프로필 / 구매 내역 / 프롬프트 등록 / 설정 / 로그아웃
- 각 항목은 Link 컴포넌트로 래핑 (클라이언트 사이드 네비게이션)

### 3.3. Footer 컴포넌트 (`components/layout/Footer.tsx`)

**구성:**
- **왼쪽:** 로고 + 설명 + 저작권
- **중앙:** 서비스 링크 (둘러보기, 판매하기, 구매 내역)
- **오른쪽:** 고객 지원 (도움말, 이용약관, 개인정보처리방침)
- **하단:** 포인트 시스템 강조 문구

### 3.4. 루트 레이아웃 (`app/layout.tsx`)

**구조:**
```typescript
<html>
  <body className="flex min-h-screen flex-col">
    <Header user={user} />
    <main className="flex-1">{children}</main>
    <Footer />
  </body>
</html>
```

**핵심:**
- `flex flex-col min-h-screen`으로 푸터를 화면 하단에 고정
- `flex-1`을 main에 적용하여 여백을 main이 차지

### 3.5. 홈 페이지 (`app/page.tsx`)

**Hero Section:**
```typescript
<section className="py-20 md:py-32">
  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">
    FOMPT
  </h1>
  <p className="text-xl md:text-2xl text-gray-600">
    네 아이디어, 폼 나게 팔자
  </p>
  <Button>지금 시작하기 🚀</Button>
  <Button variant="outline">프롬프트 둘러보기</Button>
</section>
```

**Features Section:**
- 3개의 Card 컴포넌트로 핵심 가치 표현
- 각 카드에 아이콘 (Sparkles, TrendingUp, Shield)
- Grid 레이아웃 (모바일: 1열, 데스크톱: 3열)

**CTA Section:**
- 그라데이션 배경 카드
- "100 포인트 무료 지급" 강조
- "무료로 시작하기" 버튼

---

## 4. 명령어 (Commands)

이번 단계는 컴포넌트 구현만 수행하므로 별도 명령어 없음.

**개발 서버 확인:**
```bash
npm run dev
# http://localhost:3000 접속
```

---

## 5. 결과 (Result)

### 5.1. 생성/수정된 파일

| 파일                         | 라인 수 | 역할                              |
| ---------------------------- | ------- | --------------------------------- |
| `components/layout/Header.tsx`| 220    | 전역 헤더 (로고, 네비게이션, 인증) |
| `components/layout/Footer.tsx`| 90     | 전역 푸터 (링크, 저작권)           |
| `app/layout.tsx`             | 25      | 루트 레이아웃 (Header + Footer)   |
| `app/page.tsx`               | 95      | 홈 페이지 (Hero + Features + CTA) |

### 5.2. 핵심 성과

1. **일관된 브랜드 경험**
   - Violet → Cyan 그라데이션을 로고, 버튼, 뱃지에 일관 적용
   - "네 아이디어, 폼 나게 팔자" 슬로건 반복 노출

2. **인증 상태별 UI**
   - 로그인: 포인트 + 프로필 드롭다운
   - 비로그인: 로그인 + 시작하기 버튼

3. **반응형 디자인**
   - 데스크톱: 중앙 네비게이션 + 상단 포인트
   - 모바일: 하단 탭 바 + 간소화된 헤더

4. **접근성**
   - shadcn/ui 컴포넌트로 키보드 네비게이션 지원
   - Semantic HTML (header, nav, main, footer)

### 5.3. 시각적 요소

**색상 사용:**
- Primary: `#8B5CF6` (Violet)
- Secondary: `#06B6D4` (Cyan)
- 배경: White / Gray-50
- 텍스트: Gray-900 / Gray-600 / Gray-500

**타이포그래피:**
- 로고: `text-2xl` (데스크톱)
- Hero 제목: `text-5xl` (모바일) → `text-7xl` (데스크톱)
- 본문: `text-sm` ~ `text-xl`

**아이콘:**
- lucide-react 사용 (LogIn, User, Settings, LogOut, ShoppingBag, Plus, Sparkles, TrendingUp, Shield)

### 5.4. 검증 방법

```bash
npm run dev
```

**확인 항목:**
1. 헤더가 스크롤 시에도 상단 고정되는지
2. 로고 클릭 시 홈으로 이동하는지
3. "시작하기" 버튼이 `/auth/signup`으로 이동하는지
4. 반응형이 제대로 동작하는지 (브라우저 크기 조절)
5. 푸터가 화면 하단에 고정되는지

### 5.5. 다음 단계 (Next Steps)

- **Step 5:** 인증 페이지 UI 퍼블리싱
  - `/auth/login` - 로그인 폼 (이메일 + 비밀번호)
  - `/auth/signup` - 회원가입 폼 (닉네임 + 이메일 + 비밀번호 + 추천인 코드)
  - "가입 즉시 100 포인트 지급" 강조

---

## 6. 재현성 체크리스트 (Reproducibility Checklist)

- [x] Header 컴포넌트 구현 (로그인/비로그인 상태 분기)
- [x] Footer 컴포넌트 구현
- [x] 루트 레이아웃에 Header + Footer 통합
- [x] 홈 페이지 Hero + Features + CTA 섹션 구현
- [x] 반응형 디자인 (모바일 탭 바)
- [x] 브랜드 색상 일관성 확보
- [x] shadcn/ui 컴포넌트 활용 (Button, Badge, Avatar, DropdownMenu, Card)

**결론:** 전역 레이아웃 구축 완료. 이제 모든 페이지에서 일관된 헤더/푸터가 표시됩니다.

---

## 7. 향후 개선 사항

### 7.1. 현재 제한사항

- Header의 `user` prop이 항상 `null` (Supabase 인증 연동 필요)
- `onLogout` 핸들러가 콘솔 로그만 출력 (실제 로그아웃 로직 필요)

### 7.2. 개선 방향

**Server Component에서 사용자 정보 가져오기:**
```typescript
// app/layout.tsx (Server Component)
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function RootLayout({ children }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let user = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    user = data
  }

  return (
    <html>
      <body>
        <Header user={user} />
        {children}
      </body>
    </html>
  )
}
```

**Client Component로 로그아웃 처리:**
```typescript
'use client'
import { supabase } from '@/lib/supabase'

async function handleLogout() {
  await supabase.auth.signOut()
  window.location.href = '/'
}
```

→ 이는 Step 5 (인증 페이지) 완료 후 통합할 예정
