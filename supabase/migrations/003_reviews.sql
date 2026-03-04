-- ============================================
-- Reviews System for FOMPT
-- Supabase SQL Editor에서 실행
-- ============================================

-- Reviews 테이블
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_review unique (reviewer_id, prompt_id)
);

-- 인덱스
create index if not exists idx_reviews_prompt_id on public.reviews(prompt_id);
create index if not exists idx_reviews_reviewer_id on public.reviews(reviewer_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

-- updated_at 자동 갱신 트리거
drop trigger if exists on_reviews_updated on public.reviews;
create trigger on_reviews_updated
  before update on public.reviews
  for each row execute function public.handle_updated_at();

-- ============================================
-- Row Level Security
-- ============================================
alter table public.reviews enable row level security;

-- 누구나 리뷰 읽기 가능
create policy "reviews_select" on public.reviews
  for select using (true);

-- 본인만 리뷰 작성 가능
create policy "reviews_insert" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- 본인 리뷰만 수정 가능
create policy "reviews_update" on public.reviews
  for update using (auth.uid() = reviewer_id);

-- 본인 리뷰만 삭제 가능
create policy "reviews_delete" on public.reviews
  for delete using (auth.uid() = reviewer_id);

-- ============================================
-- RPC: 리뷰 제출 (원자적 트랜잭션)
-- 리뷰 삽입 + 프롬프트 rating_avg 재계산
-- ============================================
create or replace function public.submit_review(
  p_reviewer_id uuid,
  p_prompt_id uuid,
  p_rating integer,
  p_comment text default ''
)
returns void as $$
declare
  v_seller_id uuid;
  v_existing_review uuid;
  v_existing_purchase uuid;
  v_new_avg numeric(3,2);
begin
  -- 1) 프롬프트 판매자 조회
  select seller_id into v_seller_id
  from public.prompts
  where id = p_prompt_id and status = 'ACTIVE';

  if v_seller_id is null then
    raise exception 'prompt not found';
  end if;

  -- 2) 자기 프롬프트에는 리뷰 불가
  if p_reviewer_id = v_seller_id then
    raise exception 'cannot review own prompt';
  end if;

  -- 3) 구매한 프롬프트만 리뷰 가능
  select id into v_existing_purchase
  from public.purchases
  where buyer_id = p_reviewer_id and prompt_id = p_prompt_id;

  if v_existing_purchase is null then
    raise exception 'purchase required';
  end if;

  -- 4) 중복 리뷰 확인
  select id into v_existing_review
  from public.reviews
  where reviewer_id = p_reviewer_id and prompt_id = p_prompt_id;

  if v_existing_review is not null then
    raise exception 'already reviewed';
  end if;

  -- 5) 평점 범위 검증
  if p_rating < 1 or p_rating > 5 then
    raise exception 'invalid rating';
  end if;

  -- 6) 리뷰 삽입
  insert into public.reviews (reviewer_id, prompt_id, rating, comment)
  values (p_reviewer_id, p_prompt_id, p_rating, p_comment);

  -- 7) 프롬프트 평균 평점 재계산
  select round(avg(rating)::numeric, 2) into v_new_avg
  from public.reviews
  where prompt_id = p_prompt_id;

  update public.prompts
  set rating_avg = coalesce(v_new_avg, 0)
  where id = p_prompt_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- RPC: 리뷰 수정
-- ============================================
create or replace function public.update_review(
  p_reviewer_id uuid,
  p_review_id uuid,
  p_rating integer,
  p_comment text
)
returns void as $$
declare
  v_prompt_id uuid;
  v_new_avg numeric(3,2);
begin
  -- 1) 본인 리뷰인지 확인
  select prompt_id into v_prompt_id
  from public.reviews
  where id = p_review_id and reviewer_id = p_reviewer_id;

  if v_prompt_id is null then
    raise exception 'review not found or unauthorized';
  end if;

  -- 2) 평점 범위 검증
  if p_rating < 1 or p_rating > 5 then
    raise exception 'invalid rating';
  end if;

  -- 3) 리뷰 업데이트
  update public.reviews
  set rating = p_rating, comment = p_comment
  where id = p_review_id;

  -- 4) 프롬프트 평균 평점 재계산
  select round(avg(rating)::numeric, 2) into v_new_avg
  from public.reviews
  where prompt_id = v_prompt_id;

  update public.prompts
  set rating_avg = coalesce(v_new_avg, 0)
  where id = v_prompt_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- RPC: 리뷰 삭제
-- ============================================
create or replace function public.delete_review(
  p_reviewer_id uuid,
  p_review_id uuid
)
returns void as $$
declare
  v_prompt_id uuid;
  v_new_avg numeric(3,2);
begin
  -- 1) 본인 리뷰인지 확인
  select prompt_id into v_prompt_id
  from public.reviews
  where id = p_review_id and reviewer_id = p_reviewer_id;

  if v_prompt_id is null then
    raise exception 'review not found or unauthorized';
  end if;

  -- 2) 리뷰 삭제
  delete from public.reviews
  where id = p_review_id;

  -- 3) 프롬프트 평균 평점 재계산
  select round(avg(rating)::numeric, 2) into v_new_avg
  from public.reviews
  where prompt_id = v_prompt_id;

  update public.prompts
  set rating_avg = coalesce(v_new_avg, 0)
  where id = v_prompt_id;
end;
$$ language plpgsql security definer;
