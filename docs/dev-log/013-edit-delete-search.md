# 013 - 프롬프트 수정/삭제 및 검색 고도화

## 1. 목표 (Goal)
- 판매자가 본인의 프롬프트를 수정/삭제할 수 있는 기능 추가
- 검색 UX 개선: 디바운스, 태그 검색, URL 쿼리 파라미터 동기화

## 2. 추론 및 결정 (Reasoning & Decisions)

### 수정 페이지 (`/prompts/[id]/edit`)
- 등록 페이지(`create`)와 동일한 폼 구조를 재사용하되, 기존 데이터를 불러와 pre-fill
- 본인 프롬프트가 아닌 경우 "수정 권한 없음" 화면 표시
- 미인증 시 로그인 리다이렉트 (redirect 파라미터 포함)

### 삭제: soft delete 방식
- 실제 DB에서 삭제하지 않고 `status`를 `DELETED`로 변경
- RLS 정책상 ACTIVE가 아닌 프롬프트는 일반 사용자에게 비노출
- 상세 페이지에서 2단계 확인 (삭제 버튼 → "정말 삭제?" 확인)

### 검색 고도화
- **디바운스 (400ms)**: 검색어 입력 시 타이핑이 끝나면 자동으로 검색 실행, 별도 검색 버튼 불필요
- **태그 검색**: `tags` 배열 컬럼에 `contains` 쿼리 적용, 프롬프트 카드의 태그 클릭 시 해당 태그로 필터링
- **URL 쿼리 동기화**: `?q=검색어&category=CODING&sort=popular&tag=react` 형태로 URL에 반영, 공유/북마크 가능
- **Suspense 래핑**: `useSearchParams` 사용에 따른 Next.js 14 필수 대응

## 3. 구현 상세 (Implementation Details)

### 변경/추가 파일
| 파일 | 변경 내용 |
|------|-----------|
| `app/prompts/[id]/edit/page.tsx` | **신규** — 프롬프트 수정 페이지 |
| `app/prompts/[id]/page.tsx` | 수정/삭제 버튼 추가, soft delete 핸들러 |
| `app/prompts/page.tsx` | 디바운스 검색, 태그 필터, URL 쿼리 동기화, Suspense |
| `components/features/prompt/PromptCard.tsx` | `onTagClick` prop 추가 (태그 클릭 이벤트) |
| `utils/constants.ts` | `ROUTES.PROMPT_EDIT` 상수 추가 |

### 검색 필터 우선순위
```
URL 쿼리 파라미터 (초기값)
  → 사용자 입력 (상태 변경)
    → 디바운스 (400ms 대기)
      → Supabase 쿼리 실행
        → URL 업데이트 (뒤로가기/공유 대응)
```

### 삭제 플로우
```
삭제 버튼 클릭 → 확인 UI 노출 → "확인" 클릭 → status='DELETED' 업데이트 → 목록으로 이동
```

## 4. 명령어 (Commands)
```bash
npm run build
```

## 5. 결과 (Result)
- 빌드 성공 (exit 0)
- `/prompts/[id]/edit` — 프롬프트 수정 (본인만 접근)
- 상세 페이지에서 수정/삭제 버튼 노출 (소유자에게만)
- 검색: 디바운스 자동 검색, 태그 클릭 필터, URL 쿼리 공유 가능
