-- ============================================
-- Point Transaction Ledger for FOMPT
-- Supabase SQL Editor에서 실행
-- ============================================

-- 포인트 거래 내역 테이블
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('SIGNUP', 'PURCHASE', 'SALE', 'REFERRAL')),
  amount integer not null,
  balance_after integer not null,
  description text not null default '',
  related_id uuid,
  created_at timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_point_tx_user_id on public.point_transactions(user_id);
create index if not exists idx_point_tx_created_at on public.point_transactions(created_at desc);
create index if not exists idx_point_tx_type on public.point_transactions(type);

-- ============================================
-- Row Level Security
-- ============================================
alter table public.point_transactions enable row level security;

-- 본인 거래 내역만 조회 가능
create policy "point_tx_select" on public.point_transactions
  for select using (auth.uid() = user_id);

-- 직접 삽입 방지 (RPC를 통해서만 삽입)
create policy "point_tx_insert" on public.point_transactions
  for insert with check (false);

-- ============================================
-- purchase_prompt 함수 업데이트
-- 기존 구매 로직에 포인트 거래 내역 기록 추가
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

  -- 구매 기록 생성
  insert into public.purchases (buyer_id, seller_id, prompt_id, price_paid)
  values (p_buyer_id, p_seller_id, p_prompt_id, p_price);

  -- 프롬프트 판매 카운트 증가
  update public.prompts
  set purchase_count = purchase_count + 1
  where id = p_prompt_id;

  -- 구매자 포인트 거래 내역
  select points into v_buyer_points
  from public.users where id = p_buyer_id;

  insert into public.point_transactions (user_id, type, amount, balance_after, description, related_id)
  values (p_buyer_id, 'PURCHASE', -p_price, v_buyer_points, '프롬프트 구매', p_prompt_id);

  -- 판매자 포인트 거래 내역
  select points into v_seller_points
  from public.users where id = p_seller_id;

  insert into public.point_transactions (user_id, type, amount, balance_after, description, related_id)
  values (p_seller_id, 'SALE', p_price, v_seller_points, '프롬프트 판매 수익', p_prompt_id);
end;
$$ language plpgsql security definer;
