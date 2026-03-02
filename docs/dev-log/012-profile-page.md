# 012 - 마이페이지 및 구매 내역 구현

## 1. 목표 (Goal)
- 로그인한 사용자의 프로필 정보, 등록 프롬프트, 구매 프롬프트를 한눈에 볼 수 있는 마이페이지 구현
- 추천인 코드 복사 기능 제공
- `/purchases` 경로를 마이페이지의 구매 탭으로 리다이렉트

## 2. 추론 및 결정 (Reasoning & Decisions)

### 마이페이지 통합 구조
- 별도 `/purchases` 페이지를 만들기보다, 마이페이지에 탭(내 프롬프트 / 구매한 프롬프트)으로 통합
- `/purchases` URL로 접근 시 `/profile?tab=purchased`로 리다이렉트하여 일관된 UX 제공

### Suspense + useSearchParams
- 탭 상태를 `?tab=purchased` 쿼리 파라미터로 관리 → `useSearchParams` 사용
- Next.js 14 App Router 규칙에 따라 `<Suspense>` 래핑 적용

### Supabase JOIN 쿼리
- 구매 내역: `purchases` → `prompts` JOIN으로 프롬프트 정보 함께 조회
- 내 프롬프트: `prompts.seller_id`로 직접 조회
- RLS가 적용되어 있으므로 본인 데이터만 자동 필터링

## 3. 구현 상세 (Implementation Details)

### 변경/추가 파일
| 파일 | 변경 내용 |
|------|-----------|
| `app/profile/page.tsx` | **신규** — 마이페이지 (프로필, 통계, 추천인 코드, 탭 전환) |
| `app/purchases/page.tsx` | **신규** — `/profile?tab=purchased`로 리다이렉트 |

### 마이페이지 구성
1. **프로필 카드**: 아바타, 닉네임, 이메일, 등급 뱃지
2. **통계 그리드**: 보유 포인트, 판매 수, 구매 수, 총 거래
3. **추천인 코드**: 코드 표시 + 클립보드 복사 버튼
4. **탭 전환**: 내 프롬프트 (판매 목록) / 구매한 프롬프트
5. **각 프롬프트 항목**: 카테고리, 상태, 제목, 판매/조회 수, 수익 표시

## 4. 명령어 (Commands)
```bash
npm run build
```

## 5. 결과 (Result)
- 빌드 성공 (exit 0)
- `/profile` — 마이페이지 (통계, 추천인 코드, 내 프롬프트/구매 목록)
- `/purchases` — 마이페이지 구매 탭으로 자동 이동
- 미인증 시 로그인 페이지로 리다이렉트
