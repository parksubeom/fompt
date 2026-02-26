-- ============================================
-- RPC Functions for FOMPT
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. 조회수 증가 (RLS 우회, 누구나 호출 가능)
create or replace function public.increment_view_count(prompt_id uuid)
returns void as $$
begin
  update public.prompts
  set view_count = view_count + 1
  where id = prompt_id and status = 'ACTIVE';
end;
$$ language plpgsql security definer;

-- 2. 프롬프트 구매 트랜잭션
-- 포인트 차감/지급, 구매 기록 생성, 카운트 업데이트를 원자적으로 처리
create or replace function public.purchase_prompt(
  p_buyer_id uuid,
  p_prompt_id uuid,
  p_seller_id uuid,
  p_price integer
)
returns void as $$
declare
  v_buyer_points integer;
  v_existing_purchase uuid;
begin
  -- 자기 자신의 프롬프트는 구매 불가
  if p_buyer_id = p_seller_id then
    raise exception 'cannot purchase own prompt';
  end if;

  -- 이미 구매했는지 확인
  select id into v_existing_purchase
  from public.purchases
  where buyer_id = p_buyer_id and prompt_id = p_prompt_id;

  if v_existing_purchase is not null then
    raise exception 'already purchased';
  end if;

  -- 구매자 포인트 확인
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
end;
$$ language plpgsql security definer;
