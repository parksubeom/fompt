# FOMPT

FOMPT는 **한국어 AI 프롬프트 마켓플레이스**입니다.  
크리에이터가 만든 프롬프트를 등록하고, 사용자는 포인트로 구매해 활용할 수 있는 플랫폼으로, 아이디어를 거래하고 가치를 나누는 공간을 지향합니다.

---

## 서비스 소개

AI 활용이 일상이 된 환경에서, 잘 만들어진 프롬프트는 생산성과 결과 품질을 크게 좌우합니다. FOMPT는 그런 프롬프트를 한곳에서 발견하고, 제작자에게 대가를 지불하며 사용할 수 있게 합니다.

- **판매자**: 글쓰기·코딩·디자인·마케팅 등 카테고리별로 프롬프트를 등록하고, 포인트로 수익을 창출할 수 있습니다.
- **구매자**: 검색·필터·리뷰를 통해 필요한 프롬프트를 찾고, 포인트로 구매해 바로 활용할 수 있습니다.
- **플랫폼**: 가입 보너스와 추천인 제도, 거래 기반 등급 시스템으로 참여를 유도하고, 리뷰·알림·북마크로 사용성을 높였습니다.

관리자 대시보드를 통해 사용자·프롬프트·거래 현황을 파악하고 운영할 수 있습니다.

---

## 주요 기능

| 영역 | 설명 |
|------|------|
| 인증 | 이메일 회원가입/로그인, Google·Kakao OAuth, 보호된 페이지 자동 리다이렉트 |
| 포인트 | 가입 보너스(100F), 추천인 보너스(50F), 구매/판매 시 자동 차감·지급, 포인트 거래 내역 조회 |
| 등급 | 거래 횟수에 따른 BRONZE → SILVER → GOLD → PLATINUM 자동 승급 |
| 프롬프트 | 등록·수정·삭제(비공개 처리), 카테고리·정렬·검색·태그 필터, 미리보기와 본문 접근 제어 |
| 거래 | 원자적 구매 처리(RPC), 구매 내역 및 판매 통계 제공 |
| 리뷰 | 구매자만 별점(1~5)과 코멘트 작성, 평균 평점·분포 표시 및 정렬 |
| 프로필 | 마이페이지, 닉네임·아바타·비밀번호 변경, 추천인 코드 확인·복사 |
| 부가 기능 | 북마크, 구매/리뷰 알림, 토스트 피드백, 반응형 레이아웃 및 모바일 하단 네비게이션 |
| SEO | 메타·OG·Twitter 카드, sitemap.xml, robots.txt 지원 |
| 관리자 | 대시보드 통계, 사용자·프롬프트 관리, 프롬프트 상태 변경 |

---

## 기술 구성

본 프로젝트는 Next.js 14(App Router), TypeScript, Supabase를 기반으로 합니다.

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router), React 18 |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS, shadcn/ui (Radix UI), Lucide Icons |
| 백엔드 | Supabase (Auth, PostgreSQL, RLS, RPC) |
| 상태 관리 | Zustand |
| 기타 | Sonner(토스트), Next.js Middleware(세션·보호 라우트) |

---

## 프로젝트 구조

```
fompt/
├── app/                    # 페이지·레이아웃 (App Router)
│   ├── (auth)/             # 로그인·회원가입
│   ├── admin/              # 관리자 대시보드
│   ├── prompts/            # 목록·상세·등록·수정
│   ├── profile/            # 마이페이지
│   ├── settings/           # 설정
│   ├── points/             # 포인트 내역
│   ├── bookmarks/          # 북마크 목록
│   └── ...
├── components/
│   ├── ui/                 # 공통 UI 컴포넌트 (shadcn/ui)
│   ├── layout/             # Header, Footer
│   ├── features/           # 도메인별 (auth, prompt, review, notification)
│   └── providers/          # Toast, Auth 등
├── lib/                    # Supabase 클라이언트, 공통 유틸
├── types/                  # DB·전역 타입
├── utils/                  # 상수, 포맷, 검증
├── hooks/                  # 커스텀 훅
├── store/                  # Zustand 스토어
├── supabase/
│   └── migrations/         # SQL 마이그레이션 (테이블, RLS, RPC)
└── docs/
    └── dev-log/            # 단계별 개발 로그 (001~018)
```

---

## 설치 및 실행 (개발자용)

로컬에서 서비스를 실행하거나 배포 환경을 구성할 때 참고할 수 있습니다.

**요구 사항**: Node.js 18 이상, npm 9 이상

1. **의존성 설치**
   ```bash
   git clone https://github.com/your-org/fompt.git
   cd fompt
   npm install
   ```

2. **환경 변수**  
   `.env.local.example`을 복사해 `.env.local`을 만들고, Supabase 프로젝트 URL과 Anon Key를 입력합니다.  
   OAuth(Google/Kakao)는 Supabase 대시보드에서 설정합니다. `.env.local`은 버전 관리에 포함하지 마세요.

   | 변수 | 설명 |
   |------|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key (공개용) |

3. **데이터베이스**  
   Supabase 대시보드 SQL Editor에서 아래 마이그레이션을 **순서대로** 실행합니다.

   | 순서 | 파일 | 내용 |
   |------|------|------|
   | 1 | `supabase/migrations/001_initial_schema.sql` | 테이블·RLS |
   | 2 | `supabase/migrations/002_rpc_functions.sql` | 조회수·구매 RPC |
   | 3 | `supabase/migrations/003_reviews.sql` | 리뷰 테이블·RPC |
   | 4 | `supabase/migrations/004_point_transactions.sql` | 포인트 내역 |
   | 5 | `supabase/migrations/005_bookmarks_notifications.sql` | 북마크·알림 |
   | 6 | `supabase/migrations/006_admin_role.sql` | 관리자 역할 |

4. **개발 서버**
   ```bash
   npm run dev
   ```
   브라우저에서 http://localhost:3000 으로 접속합니다.

5. **빌드·린트**
   ```bash
   npm run build
   npm run lint
   ```

---

## 문서

단계별 설계·구현 내역은 `docs/dev-log/` 에 정리되어 있습니다.

| 문서 | 내용 |
|------|------|
| 001 | 프로젝트 초기화, Next.js·Tailwind·shadcn·Zustand·Supabase |
| 002 | 폴더 구조, DB 타입, 상수·유틸 |
| 003 | Supabase 클라이언트(브라우저/서버/미들웨어), 인증 보호 |
| 004 | 전역 레이아웃, 헤더·푸터, Hero·Features |
| 005–008 | 인증 UI, 연동, OAuth |
| 009 | 프롬프트 등록 (폼·검증·미리보기) |
| 010 | 프롬프트 목록 (필터·정렬·검색·페이지네이션) |
| 011 | 프롬프트 상세·구매 로직·RPC |
| 012 | 마이페이지·구매 내역 |
| 013 | 수정/삭제·검색 고도화(디바운스·태그·URL 동기화) |
| 014 | 리뷰/평점 시스템 |
| 015 | 랜딩 강화·설정·포인트 내역 |
| 016 | 북마크·알림·SEO |
| 017 | 관리자 대시보드 |
| 018 | 반응형·토스트·모바일 하단 네비 |

---

## 보안 및 운영

- **RLS**: Supabase Row Level Security로 테이블별 접근을 제한합니다.
- **RPC**: 구매·리뷰·포인트·알림 등은 `SECURITY DEFINER` RPC로 원자적으로 처리합니다.
- **보호 라우트**: 프로필, 설정, 포인트, 북마크, 프롬프트 등록, 관리자 등은 미들웨어에서 인증·권한을 확인한 뒤 리다이렉트합니다.

---

## 라이선스

이 프로젝트의 라이선스는 저장소에 명시된 조건을 따릅니다.
