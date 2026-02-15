# 006 - Supabase Auth 연동 (Phase 2 시작)

## 1. 목표 (Goal)
- 로그인/회원가입 UI의 TODO를 실제 Supabase 인증 로직으로 전환
- 세션 상태를 전역 레이아웃에 반영해 헤더 로그인 상태를 동적으로 표시
- 로그아웃 동작을 헤더에서 직접 처리
- 라우트 상수와 실제 App Router 경로(`/login`, `/signup`)를 정합화

## 2. 추론 및 결정 (Reasoning & Decisions)
- **레이아웃에서 세션 조회**: `app/layout.tsx`를 async Server Component로 전환해 `auth.getUser()` + `users` 프로필을 읽음.
- **헤더 로그아웃**: 서버에서 핸들러를 내려주지 않고, `Header`(Client Component) 내부에서 `supabase.auth.signOut()` 처리.
- **라우트 정합성 수정**: 현재 `(auth)`는 route group이므로 실제 URL은 `/auth/login`이 아니라 `/login`, `/signup`.
- **추천인 처리 우선 검증**: 회원가입 전에 추천인 코드를 먼저 조회해 잘못된 코드면 즉시 중단.

## 3. 구현 상세 (Implementation Details)
- `app/(auth)/login/page.tsx`
  - `supabase.auth.signInWithPassword` 연결
  - `redirect` 쿼리 파라미터 반영
  - 폼 상단 공통 에러(`errors.form`) 표시 추가
- `app/(auth)/signup/page.tsx`
  - 추천인 코드 유효성 조회 (`users.referral_code`)
  - `supabase.auth.signUp` 호출
  - `users` 테이블에 초기 프로필 upsert
  - 가입 보너스 + 추천인 보너스 포인트 반영
- `app/layout.tsx`
  - `createSupabaseServerClient()`로 현재 세션/프로필 조회
  - `Header`에 실사용 `user` 전달
- `components/layout/Header.tsx`
  - `onLogout` prop 제거
  - 내부 `handleLogout()` 구현 후 `router.refresh()`로 UI 동기화
- `utils/constants.ts`, `lib/supabase-middleware.ts`
  - 로그인/회원가입 경로를 `/login`, `/signup` 기준으로 수정

## 4. 명령어 (Commands)
- `npm run build`

## 5. 결과 (Result)
- 로그인/회원가입이 실제 Supabase와 통신하도록 동작 전환
- 헤더 상태가 세션 기반으로 표시되며 로그아웃도 즉시 반영
- 잘못된 경로 상수로 인한 인증 페이지 이동 불일치 제거
- 빌드 성공 확인 완료
