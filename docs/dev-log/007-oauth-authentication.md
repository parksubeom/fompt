# 007 - OAuth 인증 도입 (Google/Kakao)

## 1. 목표 (Goal)
- 이메일 로그인 외에 Google/Kakao OAuth 로그인 추가
- OAuth 로그인 사용자도 `users` 프로필/기본 포인트(100P) 자동 생성
- 콜백 라우트에서 세션 교환 및 최초 가입자 초기화 처리

## 2. 추론 및 결정 (Reasoning & Decisions)
- **콜백 라우트 방식 채택**: `/auth/callback`에서 authorization code를 session으로 교환해 쿠키 세션을 안정적으로 생성.
- **초기화 책임 분리**: OAuth 최초 로그인 시점에만 `users` 레코드를 자동 생성.
- **경로 정합성 통일**: App Router route group 구조에 맞게 로그인/회원가입 경로를 `/login`, `/signup`으로 유지.

## 3. 구현 상세 (Implementation Details)
- `components/features/auth/OAuthButtons.tsx`
  - Google/Kakao OAuth 시작 버튼 컴포넌트 추가
  - `supabase.auth.signInWithOAuth` 사용
  - `redirectTo: {origin}/auth/callback` 지정
- `app/(auth)/login/page.tsx`
  - 기존 폼 로그인 하단에 OAuth 버튼 영역 추가
- `app/(auth)/signup/page.tsx`
  - 기존 회원가입 하단에 OAuth 버튼 영역 추가
- `app/auth/callback/route.ts`
  - `exchangeCodeForSession` 수행
  - 최초 OAuth 사용자면 `users` insert (100P, BRONZE, referral_code 생성)
- `utils/constants.ts`
  - `ROUTES.AUTH_CALLBACK` 상수 추가

## 4. 명령어 (Commands)
- `npm run build`

## 5. 결과 (Result)
- 로그인/회원가입 페이지에서 소셜 로그인 버튼 제공
- OAuth 인증 성공 시 홈으로 복귀, 세션 유지
- OAuth 신규 유저 자동 프로비저닝(포인트 100 지급)
