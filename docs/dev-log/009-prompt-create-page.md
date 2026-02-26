# 009 - 프롬프트 등록 페이지 구현

## 1. 목표 (Goal)
- 로그인된 사용자가 자신의 프롬프트를 판매 등록할 수 있는 페이지 구현
- 폼 입력 → 클라이언트 검증 → 미리보기 → Supabase INSERT 플로우 완성
- 기존에 준비해둔 타입, 상수, 검증 함수, 미들웨어 라우트 보호를 실제로 연결

## 2. 추론 및 결정 (Reasoning & Decisions)

### 라우트 경로: `/prompts/create`
- `utils/constants.ts`의 `ROUTES.PROMPT_CREATE`에 이미 `/prompts/create`로 정의되어 있었음
- 헤더 네비게이션, 드롭다운 메뉴, 모바일 탭 바에서도 이미 해당 경로로 링크가 연결된 상태
- 미들웨어(`supabase-middleware.ts`)의 `protectedRoutes` 배열에 `/prompts/create`가 등록되어 있어 미인증 사용자 접근 시 자동으로 `/login?redirect=/prompts/create`로 리다이렉트

### 2-Step UX: 편집 → 미리보기
- 한 번에 제출하면 실수로 잘못된 내용이 올라갈 위험이 있음
- `edit` → `preview` 2단계 플로우를 적용하여 등록 전 최종 확인 가능
- 미리보기 화면에서는 실제 프롬프트 상세 페이지와 유사한 레이아웃으로 표시
- 미리보기 단계에서 "수정하기" 버튼으로 언제든 편집 단계로 복귀 가능

### 클라이언트 사이드 검증 강화
- 기존 `validation.ts`에 `validatePromptTitle`, `validatePromptPrice`만 있었음
- 추가 구현:
  - `validatePromptDescription()` — 10~500자
  - `validatePromptContent()` — 20~5000자
  - `validatePromptPreview()` — 10~200자
  - `validatePromptForm()` — 전체 필드 일괄 검증 후 에러 맵 반환
- 각 필드에 실시간 글자 수 카운터와 `maxLength` 속성을 함께 적용

### 태그 시스템
- 최대 5개, Enter 또는 "추가" 버튼으로 입력
- 자동 소문자 변환, 중복 방지
- 각 태그에 X 버튼으로 개별 삭제 가능
- 5개 도달 시 입력 필드 비활성화

### Supabase 타입 이슈 우회
- `Database` 타입의 `Relationships: []`가 Supabase TS SDK의 타입 추론과 정확히 맞지 않아 `.insert()` 시 `never` 타입 에러 발생
- 기존 `AuthProvider.tsx`에서도 `(supabase.from('users') as any)` 패턴으로 동일하게 우회하고 있었음
- 일관성을 위해 같은 패턴 적용: `(supabase.from('prompts') as any).insert({...})`
- 향후 Supabase CLI로 자동 생성된 타입을 적용하면 근본적으로 해결 가능

### shadcn/ui 컴포넌트 추가
- 프롬프트 등록 폼에 필요한 UI 컴포넌트 3개를 추가 설치:
  - `Textarea` — 설명, 미리보기, 본문 입력
  - `Select` — 카테고리 드롭다운
  - `Label` — 폼 필드 라벨

## 3. 구현 상세 (Implementation Details)

### 3-1. 추가/수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/prompts/create/page.tsx` | **신규** — 프롬프트 등록 페이지 (편집 + 미리보기) |
| `utils/validation.ts` | 검증 함수 4개 추가 (`Description`, `Content`, `Preview`, `Form`) |
| `components/ui/textarea.tsx` | **신규** — shadcn/ui Textarea 컴포넌트 |
| `components/ui/select.tsx` | **신규** — shadcn/ui Select 컴포넌트 |
| `components/ui/label.tsx` | **신규** — shadcn/ui Label 컴포넌트 |

### 3-2. 폼 데이터 구조

```typescript
interface PromptFormData {
  title: string          // 5~100자
  description: string    // 10~500자
  content: string        // 20~5000자 (구매 후 공개)
  preview: string        // 10~200자 (구매 전 공개)
  category: PromptCategory | ''
  price: number          // 10~10,000 포인트
  tags: string[]         // 최대 5개
}
```

### 3-3. 페이지 플로우

```
┌─────────────┐     검증 통과      ┌──────────────┐     등록 클릭      ┌──────────┐
│  편집 모드   │ ──────────────→   │  미리보기     │ ──────────────→   │ Supabase │
│  (폼 입력)  │                   │  (최종 확인)  │                   │  INSERT  │
│             │ ←──────────────   │              │                   │          │
└─────────────┘   "수정하기"       └──────────────┘                   └──────────┘
                                                                         │
                                                                    성공 시 리다이렉트
                                                                    → /prompts
```

### 3-4. 편집 모드 UI 구성

1. **상단 헤더**: 돌아가기 링크 + 아이콘 + 제목/부제
2. **제목 입력**: `Input` + 글자 수 카운터
3. **카테고리 & 가격**: 2컬럼 그리드 (`Select` + `Input[number]`)
4. **설명**: `Textarea` 3줄 + 글자 수 카운터
5. **미리보기**: 안내 텍스트 + `Textarea` 3줄
6. **프롬프트 본문**: 안내 텍스트 + `Textarea` 8줄 (모노 폰트)
7. **태그**: `Input` + 추가 버튼 + 태그 Badge 리스트
8. **참고사항 카드**: 가격 범위, 판매 시 포인트 적립 안내
9. **액션 버튼**: 취소 / 미리보기 & 등록

### 3-5. 미리보기 모드 UI 구성

- 실제 프롬프트 상세 페이지와 유사한 레이아웃
- 카테고리 Badge + 가격 Badge
- 제목 + 설명
- 미리보기 영역 (바이올렛-시안 그라데이션 배경)
- 본문 영역 (점선 테두리, "구매 후 공개" 느낌)
- 태그 리스트
- 하단: 수정하기 / 프롬프트 등록하기 버튼

### 3-6. 에러 처리

- **클라이언트 검증**: 미리보기 전환 시 전체 필드 일괄 검증, 각 필드 아래에 에러 메시지 표시
- **필드 수정 시**: 해당 필드의 에러만 개별 클리어 (다른 에러는 유지)
- **서버 에러**: Supabase INSERT 실패 시 미리보기 화면 상단에 에러 배너 표시
- **로딩 상태**: 제출 버튼 비활성화 + "등록 중..." 텍스트

## 4. 기존 인프라 활용 (Reused Infrastructure)

이번 구현에서 별도 설정 없이 기존에 준비된 코드를 그대로 활용한 부분:

| 기존 코드 | 활용 |
|-----------|------|
| `ROUTES.PROMPT_CREATE` | 라우트 경로 상수 |
| `CATEGORIES` 배열 | 카테고리 Select 옵션 (아이콘, 라벨, value) |
| `VALIDATION.PROMPT.*` | 각 필드 검증 규칙 (MIN/MAX 글자 수) |
| `POINTS.MIN_PURCHASE / MAX_PURCHASE` | 가격 범위 안내 |
| `formatPoints()` | 가격 표시 (예: "100 F") |
| `useAuthStore()` | 로그인된 사용자 정보 (seller_id) |
| `supabase` 클라이언트 | Supabase INSERT 호출 |
| 미들웨어 `protectedRoutes` | `/prompts/create` 라우트 보호 |
| Header 네비게이션 | "프롬프트 판매하기" 링크 이미 존재 |

## 5. 디자인 시스템 준수

- **그라데이션**: `from-[#8B5CF6] to-[#06B6D4]` (바이올렛 → 시안)
  - 상단 아이콘 배경, 등록 버튼, 미리보기 영역 배경에 적용
- **카드 스타일**: shadcn/ui Card 컴포넌트 활용
- **반응형**: sm 브레이크포인트에서 카테고리/가격 2컬럼 → 1컬럼 전환
- **폰트**: 프롬프트 본문 입력에 `font-mono` 적용 (코드/프롬프트 느낌)

## 6. 다음 단계 (Next Steps)

- **010 - 프롬프트 목록 페이지**: `/prompts`에 등록된 프롬프트 카드 리스트, 카테고리 필터, 정렬
- **011 - 프롬프트 상세 페이지**: `/prompts/[id]` 동적 라우트, 미리보기/구매 버튼
- **012 - 구매 로직**: 포인트 차감/지급 트랜잭션, 구매 기록 생성
- **013 - 프로필 & 구매 내역**: 마이페이지, 내 프롬프트 관리, 구매 목록
