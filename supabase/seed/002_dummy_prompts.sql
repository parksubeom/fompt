-- ============================================
-- FOMPT 더미 프롬프트 데이터
-- Supabase SQL Editor에서 실행
-- 기존 users 테이블의 첫 번째 사용자를 판매자로 사용
-- ============================================

DO $$
DECLARE
  v_seller_id uuid;
BEGIN
  -- 기존 유저 중 첫 번째 유저를 판매자로 사용
  SELECT id INTO v_seller_id FROM public.users LIMIT 1;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION '판매자로 사용할 유저가 없습니다. 먼저 소셜 로그인으로 가입해주세요.';
  END IF;

  -- 기존 더미 데이터 삭제 (재실행 가능하도록)
  DELETE FROM public.prompts WHERE seller_id = v_seller_id;

  -- 1. 글쓰기 카테고리
  INSERT INTO public.prompts (seller_id, title, description, content, preview, category, price, tags, view_count, purchase_count, status)
  VALUES (
    v_seller_id,
    '블로그 글 자동 작성 프롬프트 (SEO 최적화)',
    '검색엔진 최적화를 고려한 블로그 글을 자동으로 작성해주는 프롬프트입니다. 키워드만 넣으면 제목, 소제목, 본문까지 완성됩니다.',
    '너는 SEO 전문 블로그 작가야. 사용자가 제공하는 [키워드]를 기반으로 다음 형식의 블로그 글을 작성해줘:

1. 제목: [키워드]를 포함한 매력적인 제목 (60자 이내)
2. 메타 디스크립션: 155자 이내
3. H2 소제목 3~5개
4. 각 섹션 200~300자
5. 결론 및 CTA 포함

톤: 친근하지만 전문적인 존칭 사용
타겟: 한국어 사용자, 검색을 통해 유입되는 독자

[키워드]: {{user_keyword}}',
    '검색엔진 최적화를 고려한 블로그 글을 작성합니다. 키워드를 넣으면 제목, 소제목 구조, 본문이 자동으로 생성됩니다. SEO 메타 태그도 포함...',
    'WRITING',
    50,
    ARRAY['블로그', 'SEO', '글쓰기', '콘텐츠', '마케팅'],
    234,
    18,
    'ACTIVE'
  );

  -- 2. 코딩 카테고리
  INSERT INTO public.prompts (seller_id, title, description, content, preview, category, price, tags, view_count, purchase_count, status)
  VALUES (
    v_seller_id,
    'React 컴포넌트 코드리뷰 & 리팩토링 프롬프트',
    'React 코드를 붙여넣으면 코드리뷰와 함께 리팩토링된 코드를 제안하는 프롬프트입니다. 성능 최적화, 패턴 개선, 타입 안전성까지 점검합니다.',
    '너는 시니어 React/TypeScript 개발자야. 사용자가 제공하는 React 컴포넌트 코드를 분석하고 다음을 수행해:

## 코드 리뷰
1. **버그 위험**: 런타임 에러, 잘못된 의존성 배열 등
2. **성능**: 불필요한 리렌더링, 메모이제이션 기회
3. **패턴**: Custom Hook 분리 가능 여부, 관심사 분리
4. **타입 안전성**: any 사용, 타입 가드 부재 등

## 리팩토링된 코드
- 위 문제를 모두 수정한 개선 코드 제공
- 변경 이유를 주석으로 설명

입력 코드:
```
{{user_code}}
```',
    'React 코드를 분석해 버그 위험, 성능 이슈, 패턴 개선점을 찾아주고 리팩토링된 코드를 제안합니다. TypeScript 타입 안전성까지...',
    'CODING',
    80,
    ARRAY['React', 'TypeScript', '코드리뷰', '리팩토링'],
    512,
    42,
    'ACTIVE'
  );

  -- 3. 디자인 카테고리
  INSERT INTO public.prompts (seller_id, title, description, content, preview, category, price, tags, view_count, purchase_count, status)
  VALUES (
    v_seller_id,
    'Midjourney 한국식 감성 일러스트 프롬프트 팩',
    'Midjourney에서 한국적 감성의 일러스트를 생성하기 위한 프롬프트 모음입니다. 계절별, 분위기별 5가지 템플릿을 제공합니다.',
    '## Midjourney 한국 감성 일러스트 프롬프트

### 1. 봄 - 벚꽃 거리
A serene Korean street scene with cherry blossom trees in full bloom, traditional hanok rooftops visible in the background, soft pastel color palette, warm golden hour lighting, Studio Ghibli inspired, watercolor texture --ar 16:9 --v 6 --style raw

### 2. 여름 - 해변 일몰
Korean coastal village at sunset, fishing boats on calm water, dramatic orange and purple sky, reflection on wet sand, nostalgic atmosphere, soft focus, film grain --ar 16:9 --v 6

### 3. 가을 - 단풍 산책로
...(총 5개 템플릿)',
    'Midjourney에서 한국적 감성의 일러스트를 생성하는 프롬프트 5종 팩입니다. 봄 벚꽃, 여름 해변, 가을 단풍, 겨울 눈경치...',
    'DESIGN',
    120,
    ARRAY['Midjourney', '일러스트', 'AI아트', '한국감성'],
    389,
    31,
    'ACTIVE'
  );

  -- 4. 마케팅 카테고리
  INSERT INTO public.prompts (seller_id, title, description, content, preview, category, price, tags, view_count, purchase_count, status)
  VALUES (
    v_seller_id,
    '인스타그램 캐러셀 카피라이팅 자동화 프롬프트',
    '인스타그램 캐러셀 콘텐츠의 카피를 자동으로 작성해주는 프롬프트입니다. 주제만 넣으면 10장 분량의 캐러셀 텍스트가 완성됩니다.',
    '너는 인스타그램 마케팅 전문가야. 사용자가 제공하는 [주제]로 10장짜리 캐러셀 포스트 카피를 작성해:

슬라이드 1 (Hook): 스크롤을 멈추게 하는 강렬한 한 줄
슬라이드 2-8 (Value): 핵심 내용을 한 장씩 정리
슬라이드 9 (Summary): 요약 정리
슬라이드 10 (CTA): 저장/공유/팔로우 유도

규칙:
- 한 슬라이드 당 최대 3줄
- 이모지 적절히 활용
- 해시태그 10개 추천

[주제]: {{topic}}
[타겟]: {{target_audience}}',
    '인스타그램 캐러셀 10장 분량의 카피를 자동으로 생성합니다. Hook, Value, CTA 구조를 포함하며 해시태그도 추천합니다...',
    'MARKETING',
    60,
    ARRAY['인스타그램', '캐러셀', '카피라이팅', 'SNS'],
    178,
    15,
    'ACTIVE'
  );

  -- 5. 교육 카테고리
  INSERT INTO public.prompts (seller_id, title, description, content, preview, category, price, tags, view_count, purchase_count, status)
  VALUES (
    v_seller_id,
    '30일 학습 계획 자동 생성기 (어떤 주제든 OK)',
    '배우고 싶은 주제를 입력하면 30일 학습 로드맵을 자동으로 만들어주는 프롬프트입니다. 매일 학습 목표, 추천 자료, 복습 퀴즈까지 포함됩니다.',
    '너는 교육 커리큘럼 설계 전문가야. 사용자가 [배우고 싶은 주제]를 제공하면 30일 학습 계획을 만들어줘:

## 출력 형식

### Week 1: 기초 다지기
- Day 1: [학습 목표] / [추천 자료 2개] / [확인 퀴즈 1개]
- Day 2: ...

### Week 2: 심화 학습
...

### Week 4: 실전 프로젝트
- Day 28-30: 미니 프로젝트

## 규칙
- 하루 학습량: 1~2시간 기준
- 난이도 점진적 상승
- 매주 복습일 1일 포함

[주제]: {{subject}}
[현재 수준]: {{current_level}}',
    '아무 주제나 넣으면 30일 학습 로드맵을 자동 생성합니다. 매일 학습 목표, 추천 자료, 퀴즈를 포함한 체계적인 커리큘럼...',
    'EDUCATION',
    40,
    ARRAY['학습', '로드맵', '교육', '자기개발', '계획'],
    645,
    53,
    'ACTIVE'
  );

  -- 6. 엔터테인먼트 카테고리
  INSERT INTO public.prompts (seller_id, title, description, content, preview, category, price, tags, view_count, purchase_count, status)
  VALUES (
    v_seller_id,
    'AI와 함께하는 텍스트 RPG 게임 마스터 프롬프트',
    'ChatGPT를 게임 마스터로 만들어 텍스트 기반 RPG를 즐길 수 있는 프롬프트입니다. 한국어 판타지 세계관이 설정되어 있습니다.',
    '너는 한국 판타지 세계관의 RPG 게임 마스터야. 다음 규칙에 따라 플레이어와 상호작용해:

## 세계관
조선 후기를 배경으로 한 판타지 세계. 요괴와 신수가 존재하며, 주인공은 퇴마사 수련생.

## 게임 시스템
- HP: 100 / MP: 50
- 스탯: 무력, 지혜, 매력, 운 (각 10 시작)
- 선택지: 매 턴 3개 제시

## 규칙
1. 매 응답마다 현재 상태(HP/MP/위치) 표시
2. 전투 시 주사위 시뮬레이션 (1d20)
3. 선택에 따라 스토리 분기
4. NPC 대사는 존댓말

플레이어에게 첫 번째 장면을 묘사하고 선택지를 제시해.',
    'ChatGPT를 한국 판타지 RPG의 게임 마스터로 만듭니다. 조선 후기 배경, 퇴마사 세계관에서 텍스트 어드벤처를...',
    'ENTERTAINMENT',
    100,
    ARRAY['RPG', '게임', '텍스트게임', '판타지'],
    892,
    67,
    'ACTIVE'
  );

END $$;
