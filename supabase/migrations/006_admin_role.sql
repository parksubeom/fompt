-- ============================================
-- Admin Role for FOMPT
-- Supabase SQL Editor에서 실행
-- ============================================

-- users 테이블에 is_admin 컬럼 추가
alter table public.users add column if not exists is_admin boolean not null default false;

-- 관리자 전용 통계 조회 RPC
create or replace function public.admin_get_stats()
returns json as $$
declare
  v_total_users integer;
  v_total_prompts integer;
  v_active_prompts integer;
  v_total_purchases integer;
  v_total_reviews integer;
  v_total_points_circulation integer;
  v_today_signups integer;
  v_today_purchases integer;
begin
  -- 권한 검증
  if not exists (select 1 from public.users where id = auth.uid() and is_admin = true) then
    raise exception 'admin access required';
  end if;

  select count(*) into v_total_users from public.users;
  select count(*) into v_total_prompts from public.prompts;
  select count(*) into v_active_prompts from public.prompts where status = 'ACTIVE';
  select count(*) into v_total_purchases from public.purchases;
  select count(*) into v_total_reviews from public.reviews;
  select coalesce(sum(points), 0) into v_total_points_circulation from public.users;

  select count(*) into v_today_signups
  from public.users
  where created_at >= current_date;

  select count(*) into v_today_purchases
  from public.purchases
  where created_at >= current_date;

  return json_build_object(
    'totalUsers', v_total_users,
    'totalPrompts', v_total_prompts,
    'activePrompts', v_active_prompts,
    'totalPurchases', v_total_purchases,
    'totalReviews', v_total_reviews,
    'totalPointsCirculation', v_total_points_circulation,
    'todaySignups', v_today_signups,
    'todayPurchases', v_today_purchases
  );
end;
$$ language plpgsql security definer;

-- 관리자 전용: 프롬프트 상태 변경
create or replace function public.admin_update_prompt_status(
  p_prompt_id uuid,
  p_status text
)
returns void as $$
begin
  if not exists (select 1 from public.users where id = auth.uid() and is_admin = true) then
    raise exception 'admin access required';
  end if;

  if p_status not in ('ACTIVE', 'SOLD_OUT', 'DELETED') then
    raise exception 'invalid status';
  end if;

  update public.prompts set status = p_status where id = p_prompt_id;
end;
$$ language plpgsql security definer;
