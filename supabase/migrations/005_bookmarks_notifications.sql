-- ============================================
-- Bookmarks & Notifications for FOMPT
-- Supabase SQL Editor에서 실행
-- ============================================

-- ============================================
-- 1. Bookmarks (즐겨찾기)
-- ============================================
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_bookmark unique (user_id, prompt_id)
);

create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_bookmarks_prompt_id on public.bookmarks(prompt_id);
create index if not exists idx_bookmarks_created_at on public.bookmarks(created_at desc);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "bookmarks_insert" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "bookmarks_delete" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- ============================================
-- 2. Notifications (알림)
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('PURCHASE_RECEIVED', 'REVIEW_RECEIVED', 'WELCOME', 'SYSTEM')),
  title text not null,
  message text not null default '',
  is_read boolean not null default false,
  related_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update" on public.notifications
  for update using (auth.uid() = user_id);

-- INSERT는 RPC를 통해서만 (SECURITY DEFINER)
create policy "notifications_insert" on public.notifications
  for insert with check (false);

-- ============================================
-- 3. purchase_prompt 업데이트 (알림 추가)
-- ============================================
create or replace function public.purchase_prompt(
  p_buyer_id uuid,
  p_prompt_id uuid,
  p_seller_id uuid,
  p_price integer
)
returns void as $$
declare
  v_buyer_points integer;
  v_seller_points integer;
  v_existing_purchase uuid;
  v_prompt_title text;
  v_buyer_nickname text;
begin
  if p_buyer_id = p_seller_id then
    raise exception 'cannot purchase own prompt';
  end if;

  select id into v_existing_purchase
  from public.purchases
  where buyer_id = p_buyer_id and prompt_id = p_prompt_id;

  if v_existing_purchase is not null then
    raise exception 'already purchased';
  end if;

  select points into v_buyer_points
  from public.users
  where id = p_buyer_id;

  if v_buyer_points < p_price then
    raise exception 'insufficient points';
  end if;

  -- 프롬프트 제목, 구매자 닉네임 조회
  select title into v_prompt_title
  from public.prompts where id = p_prompt_id;

  select nickname into v_buyer_nickname
  from public.users where id = p_buyer_id;

  -- 구매자 포인트 차감
  update public.users
  set points = points - p_price,
      total_purchases = total_purchases + 1
  where id = p_buyer_id;

  -- 판매자 포인트 지급
  update public.users
  set points = points + p_price,
      total_sales = total_sales + 1
  where id = p_seller_id;

  -- 구매 기록
  insert into public.purchases (buyer_id, seller_id, prompt_id, price_paid)
  values (p_buyer_id, p_seller_id, p_prompt_id, p_price);

  -- 판매 카운트
  update public.prompts
  set purchase_count = purchase_count + 1
  where id = p_prompt_id;

  -- 구매자 포인트 내역
  select points into v_buyer_points from public.users where id = p_buyer_id;
  insert into public.point_transactions (user_id, type, amount, balance_after, description, related_id)
  values (p_buyer_id, 'PURCHASE', -p_price, v_buyer_points, '프롬프트 구매', p_prompt_id);

  -- 판매자 포인트 내역
  select points into v_seller_points from public.users where id = p_seller_id;
  insert into public.point_transactions (user_id, type, amount, balance_after, description, related_id)
  values (p_seller_id, 'SALE', p_price, v_seller_points, '프롬프트 판매 수익', p_prompt_id);

  -- 판매자에게 구매 알림
  insert into public.notifications (user_id, type, title, message, related_id)
  values (
    p_seller_id,
    'PURCHASE_RECEIVED',
    '프롬프트가 판매되었습니다!',
    v_buyer_nickname || '님이 "' || left(v_prompt_title, 30) || '"을(를) 구매했습니다. (+' || p_price || ' F)',
    p_prompt_id
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- 4. submit_review 업데이트 (알림 추가)
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
  v_prompt_title text;
  v_reviewer_nickname text;
begin
  select seller_id, title into v_seller_id, v_prompt_title
  from public.prompts
  where id = p_prompt_id and status = 'ACTIVE';

  if v_seller_id is null then
    raise exception 'prompt not found';
  end if;

  if p_reviewer_id = v_seller_id then
    raise exception 'cannot review own prompt';
  end if;

  select id into v_existing_purchase
  from public.purchases
  where buyer_id = p_reviewer_id and prompt_id = p_prompt_id;

  if v_existing_purchase is null then
    raise exception 'purchase required';
  end if;

  select id into v_existing_review
  from public.reviews
  where reviewer_id = p_reviewer_id and prompt_id = p_prompt_id;

  if v_existing_review is not null then
    raise exception 'already reviewed';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'invalid rating';
  end if;

  insert into public.reviews (reviewer_id, prompt_id, rating, comment)
  values (p_reviewer_id, p_prompt_id, p_rating, p_comment);

  select round(avg(rating)::numeric, 2) into v_new_avg
  from public.reviews
  where prompt_id = p_prompt_id;

  update public.prompts
  set rating_avg = coalesce(v_new_avg, 0)
  where id = p_prompt_id;

  -- 판매자에게 리뷰 알림
  select nickname into v_reviewer_nickname
  from public.users where id = p_reviewer_id;

  insert into public.notifications (user_id, type, title, message, related_id)
  values (
    v_seller_id,
    'REVIEW_RECEIVED',
    '새로운 리뷰가 등록되었습니다',
    v_reviewer_nickname || '님이 "' || left(v_prompt_title, 30) || '"에 ' || p_rating || '점 리뷰를 남겼습니다.',
    p_prompt_id
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- 5. 알림 읽음 처리 RPC
-- ============================================
create or replace function public.mark_notifications_read(
  p_user_id uuid,
  p_notification_ids uuid[] default null
)
returns void as $$
begin
  if p_notification_ids is null then
    update public.notifications
    set is_read = true
    where user_id = p_user_id and is_read = false;
  else
    update public.notifications
    set is_read = true
    where user_id = p_user_id and id = any(p_notification_ids);
  end if;
end;
$$ language plpgsql security definer;
