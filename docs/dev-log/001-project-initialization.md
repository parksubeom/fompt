# 001 - 프로젝트 초기화 및 라이브러리 설치

**작성일:** 2026-02-10  
**작업자:** Senior Frontend Developer / Tech Lead

---

## 1. 목표 (Goal)

폼프트(FOMPT) 프로젝트의 기본 뼈대 구축:
- Next.js 14 프로젝트 초기화 (App Router, TypeScript)
- Tailwind CSS 설정 및 디자인 시스템 색상 적용
- shadcn/ui 설치 및 기본 컴포넌트 추가
- 전역 상태 관리(Zustand) 및 백엔드(Supabase) 패키지 설치

---

## 2. 추론 및 결정 (Reasoning & Decisions)

### 2.1. 수동 설정 vs create-next-app

**결정:** 수동으로 설정 파일 생성  
**이유:**
- `create-next-app`의 대화형 프롬프트는 CI/CD 환경에서 재현하기 어려움
- 모든 설정을 명시적으로 제어하여 **재현 가능성(Reproducibility)** 확보
- package.json, tsconfig.json 등을 버전 관리하여 정확한 의존성 추적 가능

### 2.2. Next.js 14 선택

**결정:** Next.js 14.2.18  
**이유:**
- App Router는 React Server Components를 기본 지원
- 서버 액션(Server Actions)을 통한 간결한 백엔드 로직 처리
- Supabase와의 통합 용이성

**대안:**
- Vite + React: SPA에 적합하나 SEO/SSR이 약함
- Remix: 러닝커브가 높고 생태계가 Next.js보다 작음

### 2.3. shadcn/ui 선택

**결정:** shadcn/ui (Default, Slate base color)  
**이유:**
- 컴포넌트를 직접 프로젝트에 복사하므로 커스터마이징 자유도 극대화
- Radix UI 기반으로 접근성(a11y) 보장
- Tailwind CSS와 네이티브 통합

**대안:**
- MUI: 무겁고 커스터마이징이 복잡
- Chakra UI: 번들 크기가 크고 디자인 자유도가 낮음

### 2.4. 디자인 시스템 색상

**Primary:** `#8B5CF6` (Violet) - 창의성, 프리미엄  
**Secondary:** `#06B6D4` (Cyan) - 기술, 혁신

Tailwind 설정과 CSS 변수에 모두 적용하여 일관성 유지.

### 2.5. Zustand 선택

**결정:** Zustand for 전역 상태  
**이유:**
- Redux보다 가볍고 보일러플레이트 최소화
- TypeScript 지원 우수
- DevTools 지원

**대안:**
- Redux Toolkit: 보일러플레이트가 많고 러닝커브 높음
- Jotai/Recoil: 원자(atom) 기반 모델이 단순 포인트 관리에는 과도

---

## 3. 구현 상세 (Implementation Details)

### 3.1. 생성된 파일 목록

```
/Users/user/Desktop/fompt/
├── package.json              # 의존성 및 스크립트
├── tsconfig.json             # TypeScript 설정 (Strict Mode)
├── next.config.js            # Next.js 설정
├── tailwind.config.ts        # Tailwind + 커스텀 색상
├── postcss.config.js         # PostCSS 설정
├── .eslintrc.json            # ESLint 설정
├── .gitignore                # Git 제외 파일
├── components.json           # shadcn/ui 설정
├── lib/
│   └── utils.ts              # cn() 유틸리티 함수
├── app/
│   ├── globals.css           # 전역 스타일 (CSS 변수 포함)
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 홈 페이지 (FOMPT 로고)
└── components/ui/
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    ├── dropdown-menu.tsx
    ├── avatar.tsx
    └── badge.tsx
```

### 3.2. 주요 설정

**tsconfig.json - Path Alias:**
```json
"paths": {
  "@/*": ["./*"]
}
```
→ `@/components/ui/button` 형태로 임포트 가능

**tailwind.config.ts - 커스텀 색상:**
```typescript
colors: {
  primary: { DEFAULT: "#8B5CF6", foreground: "#ffffff" },
  secondary: { DEFAULT: "#06B6D4", foreground: "#ffffff" }
}
```

**globals.css - CSS 변수:**
```css
:root {
  --primary: 262.1 83.3% 57.8%;  /* Violet */
  --secondary: 188.7 94.5% 42.7%; /* Cyan */
}
```

### 3.3. 트러블슈팅

**문제:** `create-next-app`이 대화형 프롬프트에서 멈춤  
**해결:** 수동으로 모든 설정 파일 생성 → 재현성 향상

**문제:** npm 경고 (deprecated 패키지, 보안 취약점)  
**조치:** 현재는 무시 (Next.js 14가 안정 버전이므로 프로덕션 전 업그레이드 예정)

---

## 4. 명령어 (Commands)

```bash
# 1. 수동으로 설정 파일 생성 (package.json, tsconfig.json 등)

# 2. 의존성 설치
npm install

# 3. shadcn/ui 관련 패키지 설치
npm install class-variance-authority clsx tailwind-merge lucide-react

# 4. shadcn/ui 컴포넌트 추가
npx shadcn@latest add button input card dropdown-menu avatar badge

# 5. 전역 상태 및 백엔드 패키지 설치
npm install zustand @supabase/supabase-js

# 6. 개발 서버 실행 (확인용)
npm run dev
# → http://localhost:3000 접속 시 "FOMPT" 로고가 그라데이션으로 표시됨
```

---

## 5. 결과 (Result)

### 5.1. 설치된 주요 패키지

| 패키지                  | 버전    | 용도                          |
| ----------------------- | ------- | ----------------------------- |
| next                    | 14.2.18 | 프레임워크                    |
| react                   | 18.3.1  | UI 라이브러리                 |
| typescript              | ^5      | 타입 안정성                   |
| tailwindcss             | ^3.4.1  | 유틸리티 CSS                  |
| zustand                 | latest  | 전역 상태 관리                |
| @supabase/supabase-js   | latest  | 백엔드/인증                   |
| lucide-react            | latest  | 아이콘                        |
| class-variance-authority| latest  | 조건부 클래스 관리 (CVA)      |

### 5.2. 검증 방법

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → 화면 중앙에 **FOMPT** 로고가 Violet → Cyan 그라데이션으로 표시되어야 함.

### 5.3. 다음 단계 (Next Steps)

- **Step 2:** 폴더 구조 정립 및 Supabase 타입 정의
- **Step 3:** Supabase 클라이언트 설정 (.env.local)
- **Step 4:** 전역 레이아웃 및 헤더 컴포넌트 구현
- **Step 5:** 인증 페이지 UI 퍼블리싱

---

## 6. 재현성 체크리스트 (Reproducibility Checklist)

- [x] package.json에 모든 의존성 명시
- [x] tsconfig.json, tailwind.config.ts 등 설정 파일 포함
- [x] 설치 명령어 문서화
- [x] 디자인 시스템 색상 코드 명시
- [x] 대안 기술 스택 및 선택 이유 기록

**결론:** 이 문서만으로 다른 환경에서 동일한 프로젝트를 재현할 수 있음.
