# 008 - 소셜 로그인 기능 완성

## 1. 목표 (Goal)
- 007에서 골격만 잡았던 OAuth 플로우를 실사용 가능 수준으로 보강
- OAuth 에러 피드백, 닉네임 중복 방어, 클라이언트 세션 동기화, DB 스키마 확정

## 2. 추론 및 결정 (Reasoning & Decisions)

### UI 배치: 소셜 로그인 우선
- 마켓플레이스 서비스 특성상 가입 전환율이 핵심 → 소셜 버튼을 최상단에 배치
- 이메일 가입은 "또는" 구분선 아래 토글 형태로 접을 수 있게 변경
- Google/Kakao 버튼에 공식 SVG 아이콘을 인라인으로 삽입해 외부 의존 제거

### Suspense 래핑
- Next.js 14 App Router에서 `useSearchParams()`는 반드시 `<Suspense>` 내부에서 호출해야 함
- 로그인·회원가입 폼 컴포넌트를 별도 분리 후 `Suspense`로 래핑

### OAuth 에러 표시
- 콜백 라우트(`/auth/callback`)에서 실패 시 `?error=oauth-code-missing` 등으로 리다이렉트
- 로그인 페이지에서 해당 쿼리 파라미터를 읽어 한국어 메시지로 변환

### 닉네임 중복 처리
- OAuth 첫 로그인 시 소셜 프로필 이름 또는 이메일 로컬 파트로 닉네임 생성
- 동명 사용자 방지를 위해 `resolveUniqueNickname()` 함수 추가
  - 기본 닉네임이 이미 존재하면 `_{4자리 랜덤}` suffix 부여, 최대 10회 시도
  - 그래도 실패 시 `_{timestamp base36}` 으로 fallback

### Zustand Auth Store
- `store/auth.ts`: 전역 인증 상태 (user, isLoading)
- `components/providers/AuthProvider.tsx`: 서버에서 가져온 user를 초기값으로 세팅 후, `onAuthStateChange`로 실시간 동기화
- layout.tsx에서 AuthProvider로 앱을 래핑

### SQL 마이그레이션
- `supabase/migrations/001_initial_schema.sql`에 3개 테이블(users, prompts, purchases), 인덱스, RLS 정책, updated_at 트리거를 모두 포함

### PKCE Flow 전환
- 기존 implicit flow는 인증 후 토큰이 URL 해시(`#access_token=...`)에 노출되는 문제 발생
- `lib/supabase.ts`에 `flowType: 'pkce'` 옵션 추가
- PKCE 적용 후 OAuth 인증 코드가 `/auth/callback?code=...`로 전달되어 서버에서 안전하게 세션 교환

### Vercel 배포
- GitHub 연동으로 `https://fompt.vercel.app` 배포 완료
- 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) Vercel 대시보드에서 설정
- Supabase URL Configuration에 배포 URL 등록 (`Site URL`, `Redirect URLs`)

## 3. 구현 상세 (Implementation Details)

### 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `components/features/auth/OAuthButtons.tsx` | `mode` prop 제거, Google/Kakao SVG 아이콘 인라인 삽입, 구분선 제거 (부모가 처리) |
| `app/(auth)/login/page.tsx` | `LoginForm` 분리 + `Suspense` 래핑, OAuth 에러 메시지 표시, 소셜 버튼 상단 배치 |
| `app/(auth)/signup/page.tsx` | `SignupForm` 분리 + `Suspense` 래핑, 이메일 폼 토글 형태로 변경, 소셜 버튼 상단 배치 |
| `app/auth/callback/route.ts` | `resolveUniqueNickname()` 추가로 닉네임 중복 시 suffix 자동 부여 |
| `store/auth.ts` | Zustand 기반 AuthState 스토어 생성 |
| `components/providers/AuthProvider.tsx` | 서버 user 초기값 세팅 + `onAuthStateChange` 리스너 |
| `app/layout.tsx` | `AuthProvider`로 앱 래핑 |
| `supabase/migrations/001_initial_schema.sql` | 전체 DB 스키마 (테이블, 인덱스, RLS, 트리거) |
| `lib/supabase.ts` | `flowType: 'pkce'` 추가로 implicit → PKCE flow 전환 |

## 4. 명령어 (Commands)
```bash
npm run build
git push origin main   # Vercel 자동 배포 트리거
```

## 5. 결과 (Result)
- 빌드 성공 (exit 0, 타입 에러 없음)
- Vercel 배포 완료: `https://fompt.vercel.app`
- 소셜 로그인 → PKCE 콜백 → 프로필 자동 생성까지 전체 플로우 코드 완성
- DB 스키마 SQL 제공으로 Supabase 대시보드에서 즉시 테이블 생성 가능
- 클라이언트 측 인증 상태가 Zustand로 관리되어 탭 간 세션 동기화 대응

## 6. 외부 설정 사항
1. **Supabase SQL Editor**에서 `supabase/migrations/001_initial_schema.sql` 실행 ✅
2. **Supabase Auth > URL Configuration**: Site URL을 `https://fompt.vercel.app`, Redirect URLs에 `https://fompt.vercel.app/**` 추가
3. **Supabase Auth > Providers**에서 Google/Kakao 활성화 및 Client ID/Secret 입력
4. **Google Cloud Console** OAuth 동의화면 + 리다이렉트 URI: `https://jvdgsjbvhmzqzmrxlekd.supabase.co/auth/v1/callback`
5. **Kakao Developers** 앱 생성 + 리다이렉트 URI: `https://jvdgsjbvhmzqzmrxlekd.supabase.co/auth/v1/callback`
