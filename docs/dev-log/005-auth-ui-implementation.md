# 005 - 인증 페이지 UI 구현

**작성일:** 2026-02-10  
**작업자:** Senior Frontend Developer / Tech Lead

---

## 1. 목표 (Goal)

사용자 인증을 위한 UI 퍼블리싱:
- 로그인 페이지 구현 (이메일 + 비밀번호)
- 회원가입 페이지 구현 (닉네임 + 이메일 + 비밀번호 + 추천인 코드)
- "가입 즉시 100 포인트 지급" 강조
- 클라이언트 사이드 유효성 검증
- 반응형 디자인 및 접근성 확보

---

## 2. 추론 및 결정 (Reasoning & Decisions)

### 2.1. Route Group 활용

**결정:** `(auth)` Route Group 생성  
**이유:**
- `/auth/login`, `/auth/signup`으로 URL 구조화
- `(auth)/layout.tsx`로 공통 레이아웃 적용 (중앙 정렬 카드)
- URL에 `auth`는 포함되지만, 폴더명 `(auth)`는 괄호로 제외

**폴더 구조:**
```
app/
└── (auth)/
    ├── layout.tsx       # 인증 페이지 공통 레이아웃
    ├── login/
    │   └── page.tsx
    └── signup/
        └── page.tsx
```

### 2.2. 폼 검증 전략

**결정:** 클라이언트 사이드 유효성 검증 우선  
**이유:**
- 빠른 피드백 (서버 요청 없이 즉시 에러 표시)
- `utils/validation.ts` 함수 재사용
- 서버 사이드 검증은 Supabase 연동 시 추가

**검증 흐름:**
```typescript
const emailValidation = validateEmail(email)
const passwordValidation = validatePassword(password)

if (!emailValidation.isValid) {
  setErrors({ email: emailValidation.error })
  return
}

// 검증 통과 후 Supabase 요청
await supabase.auth.signInWithPassword({ email, password })
```

### 2.3. 회원가입 페이지 특징

**결정:** 추천인 코드 입력 필드 추가 (선택 사항)  
**이유:**
- 바이럴 마케팅 및 커뮤니티 성장 촉진
- 추천인과 피추천인 모두에게 50 포인트 지급
- 8자리 대문자+숫자 형식 (예: `ABC12345`)

**UI 강조:**
```typescript
<div className="bg-gradient-to-r from-violet-50 to-cyan-50 rounded-lg p-3">
  <Gift className="w-5 h-5 text-primary" />
  <span>가입 즉시 <Badge>100 F</Badge> 지급!</span>
</div>
```

### 2.4. 비밀번호 확인 필드

**결정:** 회원가입에만 비밀번호 확인 필드 추가  
**이유:**
- 로그인: 비밀번호를 이미 알고 있으므로 확인 불필요
- 회원가입: 오타 방지를 위해 두 번 입력

**검증 로직:**
```typescript
if (formData.password !== formData.passwordConfirm) {
  setErrors({ passwordConfirm: '비밀번호가 일치하지 않습니다.' })
  return
}
```

### 2.5. 로딩 상태 관리

**결정:** `isLoading` state로 버튼 비활성화 + 로딩 텍스트 표시  
**이유:**
- 중복 제출 방지
- 사용자에게 진행 상태 피드백

**구현:**
```typescript
<Button disabled={isLoading}>
  {isLoading ? '로그인 중...' : '로그인'}
</Button>
```

### 2.6. 에러 표시 전략

**결정:** 필드별 에러 메시지 + 실시간 에러 제거  
**이유:**
- 어떤 필드가 잘못되었는지 명확히 표시
- 사용자가 수정하면 에러 메시지 즉시 제거 (UX 개선)

**구현:**
```typescript
const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' })) // 에러 제거
  }
}
```

---

## 3. 구현 상세 (Implementation Details)

### 3.1. 파일 구조

```
app/(auth)/
├── layout.tsx           # 중앙 정렬 레이아웃
├── login/
│   └── page.tsx         # 로그인 페이지
└── signup/
    └── page.tsx         # 회원가입 페이지
```

### 3.2. Auth Layout (`(auth)/layout.tsx`)

**목적:** 인증 페이지 공통 스타일 (중앙 정렬 카드)

```typescript
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

**핵심:**
- `min-h-[calc(100vh-4rem)]`: 헤더 높이(4rem)를 제외한 전체 높이
- `items-center justify-center`: 수평/수직 중앙 정렬
- `max-w-md`: 카드 최대 너비 448px

### 3.3. 로그인 페이지 (`login/page.tsx`)

**폼 필드:**
1. 이메일 (필수)
2. 비밀번호 (필수)

**주요 기능:**

1. **아이콘 + 입력 필드:**
```typescript
<div className="relative">
  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
  <Input
    type="email"
    placeholder="example@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="pl-10" // 아이콘 공간 확보
  />
</div>
```

2. **비밀번호 찾기 링크:**
```typescript
<Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
  비밀번호를 잊으셨나요?
</Link>
```

3. **회원가입 링크:**
```typescript
<div className="text-center text-sm">
  아직 계정이 없으신가요?{' '}
  <Link href={ROUTES.SIGNUP} className="text-primary font-medium">
    회원가입
  </Link>
</div>
```

### 3.4. 회원가입 페이지 (`signup/page.tsx`)

**폼 필드:**
1. 닉네임 (필수, 2-20자, 한글/영문/숫자/언더스코어)
2. 이메일 (필수)
3. 비밀번호 (필수, 최소 8자)
4. 비밀번호 확인 (필수)
5. 추천인 코드 (선택, 8자리 대문자+숫자)

**특별 UI 요소:**

1. **가입 보너스 강조 배너:**
```typescript
<div className="bg-gradient-to-r from-violet-50 to-cyan-50 rounded-lg p-3 border border-primary/20">
  <Gift className="w-5 h-5 text-primary" />
  <span>
    가입 즉시{' '}
    <Badge variant="secondary" className="bg-primary text-white">
      {POINTS.SIGNUP_BONUS} F
    </Badge>
    {' '}지급!
  </span>
</div>
```

2. **추천인 코드 입력 필드:**
```typescript
<Input
  type="text"
  placeholder="ABC12345"
  value={formData.referralCode}
  onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
  className="uppercase"
  maxLength={8}
/>
<p className="text-xs text-gray-500">
  추천인 코드 입력 시 추가 {POINTS.REFERRAL_BONUS} 포인트 지급
</p>
```

3. **이용약관 동의 안내:**
```typescript
<p className="text-xs text-center text-gray-500">
  가입 시{' '}
  <Link href="/terms" className="underline">이용약관</Link>
  {' '}및{' '}
  <Link href="/privacy" className="underline">개인정보처리방침</Link>
  에 동의하는 것으로 간주됩니다.
</p>
```

### 3.5. 유효성 검증 흐름

**로그인:**
```typescript
const emailValidation = validateEmail(email)
const passwordValidation = validatePassword(password)

if (!emailValidation.isValid || !passwordValidation.isValid) {
  setErrors({
    email: emailValidation.error,
    password: passwordValidation.error,
  })
  return
}

// Supabase 로그인 (TODO)
```

**회원가입:**
```typescript
const nicknameValidation = validateNickname(formData.nickname)
const emailValidation = validateEmail(formData.email)
const passwordValidation = validatePassword(formData.password)
const referralValidation = validateReferralCode(formData.referralCode)

// 비밀번호 일치 확인
if (formData.password !== formData.passwordConfirm) {
  newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
}

// 모든 검증 통과 시 Supabase 회원가입 (TODO)
```

---

## 4. 명령어 (Commands)

이번 단계는 UI 구현만 수행하므로 별도 명령어 없음.

**개발 서버 확인:**
```bash
npm run dev
# http://localhost:3000/auth/login 접속
# http://localhost:3000/auth/signup 접속
```

---

## 5. 결과 (Result)

### 5.1. 생성된 파일

| 파일                         | 라인 수 | 역할                              |
| ---------------------------- | ------- | --------------------------------- |
| `app/(auth)/layout.tsx`      | 15      | 인증 페이지 공통 레이아웃         |
| `app/(auth)/login/page.tsx`  | 155     | 로그인 폼                         |
| `app/(auth)/signup/page.tsx` | 280     | 회원가입 폼 (추천인 코드 포함)    |

**총 라인 수:** ~450 lines

### 5.2. 핵심 성과

1. **완전한 폼 검증**
   - 이메일, 비밀번호, 닉네임, 추천인 코드 검증
   - 실시간 에러 피드백

2. **추천인 시스템**
   - 추천인 코드 입력으로 추가 50 포인트
   - 바이럴 마케팅 촉진

3. **가입 보너스 강조**
   - 그라데이션 배너로 100 포인트 지급 강조
   - CTA 버튼: "가입하고 100 포인트 받기"

4. **접근성**
   - Label과 Input 연결 (`htmlFor`, `id`)
   - 아이콘으로 시각적 힌트 제공
   - 에러 메시지 읽기 쉽게 표시

5. **반응형 디자인**
   - 모바일: 전체 너비 카드
   - 데스크톱: 최대 448px 중앙 정렬

### 5.3. UI 요소

**색상:**
- 그라데이션 버튼: Violet → Cyan
- 에러 메시지: Red-600
- 안내 텍스트: Gray-500

**아이콘 (lucide-react):**
- LogIn, UserPlus (카드 헤더)
- Mail, Lock, User, Gift (입력 필드)

**카드 구성:**
- CardHeader: 타이틀 + 설명 + 보너스 배너
- CardContent: 폼 필드
- CardFooter: 제출 버튼 + 링크

### 5.4. 검증 방법

```bash
npm run dev
```

**확인 항목:**

**로그인 페이지 (`/auth/login`):**
1. 이메일 형식 검증 (잘못된 형식 입력 시 에러)
2. 비밀번호 8자 미만 입력 시 에러
3. 로딩 중 버튼 비활성화
4. "회원가입" 링크 클릭 시 `/auth/signup` 이동

**회원가입 페이지 (`/auth/signup`):**
1. 닉네임 2-20자 검증
2. 비밀번호 확인 불일치 시 에러
3. 추천인 코드 8자리 검증 (선택 사항)
4. 가입 보너스 배너 표시
5. "로그인" 링크 클릭 시 `/auth/login` 이동

### 5.5. 다음 단계 (Next Steps)

**Supabase 인증 연동:**

1. **로그인 로직 구현:**
```typescript
import { supabase } from '@/lib/supabase'

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (error) {
  setErrors({ email: '로그인에 실패했습니다.' })
  return
}

// 로그인 성공 시 홈으로 리다이렉트
router.push(ROUTES.HOME)
```

2. **회원가입 로직 구현:**
```typescript
import { supabase } from '@/lib/supabase'
import { generateReferralCode } from '@/utils/format'

// 1. Supabase Auth 회원가입
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
})

if (authError) {
  setErrors({ email: '회원가입에 실패했습니다.' })
  return
}

// 2. Users 테이블에 추가 정보 저장
const { error: dbError } = await supabase.from('users').insert({
  id: authData.user!.id,
  email: formData.email,
  nickname: formData.nickname,
  referral_code: generateReferralCode(),
  referred_by: formData.referralCode || null,
  points: 100, // 가입 보너스
})

// 3. 추천인 코드 입력 시 추가 포인트 지급
if (formData.referralCode) {
  // TODO: 추천인에게 50 포인트, 본인에게 50 포인트 추가
}

router.push(ROUTES.HOME)
```

3. **세션 관리:**
- Middleware에서 자동 세션 갱신 (이미 구현됨)
- Header에서 실제 사용자 정보 표시 (Step 4에서 TODO로 남김)

---

## 6. 재현성 체크리스트 (Reproducibility Checklist)

- [x] Route Group `(auth)` 생성
- [x] 로그인 페이지 UI 구현
- [x] 회원가입 페이지 UI 구현
- [x] 추천인 코드 입력 필드 추가
- [x] 가입 보너스 강조 UI
- [x] 클라이언트 사이드 폼 검증
- [x] 로딩 상태 관리
- [x] 에러 메시지 표시
- [x] 반응형 디자인

**결론:** 인증 페이지 UI 퍼블리싱 완료. Supabase Auth 연동만 남았습니다.

---

## 7. MVP 완성도

### 7.1. 완료된 Step 목록

✅ **Step 1:** 프로젝트 초기화 및 라이브러리 설치  
✅ **Step 2:** 폴더 구조 및 타입 정의  
✅ **Step 3:** Supabase 클라이언트 설정  
✅ **Step 4:** 전역 레이아웃 및 헤더  
✅ **Step 5:** 인증 페이지 UI 구현  

### 7.2. MVP 현황

**구현 완료:**
- ✅ Next.js 14 + TypeScript + Tailwind CSS 세팅
- ✅ shadcn/ui 컴포넌트 통합
- ✅ 디자인 시스템 (Violet → Cyan 그라데이션)
- ✅ 전역 레이아웃 (Header + Footer)
- ✅ 홈 페이지 (Hero + Features + CTA)
- ✅ 인증 페이지 (로그인 + 회원가입)
- ✅ 타입 정의 (User, Prompt, Purchase)
- ✅ 유틸리티 함수 (포맷팅, 검증, 상수)
- ✅ Supabase 클라이언트 (Client/Server/Middleware)

**남은 작업 (백엔드 연동):**
- ⏳ Supabase Auth 연동 (로그인/회원가입 로직)
- ⏳ 프롬프트 목록 페이지
- ⏳ 프롬프트 상세 페이지
- ⏳ 프롬프트 등록 페이지
- ⏳ 구매 로직 (포인트 차감/지급)
- ⏳ 프로필 페이지
- ⏳ 구매 내역 페이지

### 7.3. 문서화 현황

| 문서                              | 라인 수 | 상태 |
| --------------------------------- | ------- | ---- |
| 001-project-initialization.md     | 250     | ✅   |
| 002-folder-structure-and-types.md | 280     | ✅   |
| 003-supabase-setup.md             | 380     | ✅   |
| 004-global-layout-header.md       | 320     | ✅   |
| 005-auth-ui-implementation.md     | 430     | ✅   |

**총 문서 라인 수:** ~1,660 lines

---

## 8. 최종 검증

```bash
# 1. 개발 서버 시작
npm run dev

# 2. 브라우저 테스트
# - http://localhost:3000 (홈)
# - http://localhost:3000/auth/login (로그인)
# - http://localhost:3000/auth/signup (회원가입)

# 3. 타입 체크
npx tsc --noEmit

# 4. ESLint 검사
npm run lint
```

**예상 결과:**
- ✅ 타입 오류 없음
- ✅ ESLint 에러 없음 (경고는 무시 가능)
- ✅ 모든 페이지 정상 렌더링
- ✅ 폼 검증 정상 작동

---

## 9. 다음 작업 추천 순서

1. **Supabase Auth 연동** (우선순위 최상)
   - 로그인/회원가입 로직 구현
   - 세션 관리 및 Header 사용자 정보 표시

2. **프롬프트 CRUD**
   - 목록 페이지 (`/prompts`)
   - 상세 페이지 (`/prompts/[id]`)
   - 등록 페이지 (`/prompts/create`)

3. **구매 시스템**
   - 포인트 차감/지급 로직
   - 구매 내역 페이지 (`/purchases`)

4. **프로필 페이지**
   - 내 프로필 보기/수정
   - 판매 중인 프롬프트 목록
   - 추천인 코드 공유

**결론:** 재현 가능한 개발 원칙에 따라 모든 Step이 완료되었습니다. 이제 백엔드 연동을 시작할 준비가 되었습니다!
