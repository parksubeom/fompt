-- ============================================
-- FOMPT 초기 스키마
-- Supabase SQL Editor에서 실행
-- ============================================
-- 기존 테이블이 있으면 삭제 후 재생성 (의존 관계 순서 주의)
drop table if exists public.purchases cascade;
drop table if exists public.prompts cascade;
drop table if exists public.users cascade;

-- Users 테이블
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null unique,
  avatar_url text,
  points integer not null default 100,
  referral_code text not null unique,
  referred_by text,
  tier text not null default 'BRONZE' check (tier in ('BRONZE','SILVER','GOLD','PLATINUM')),
  total_sales integer not null default 0,
  total_purchases integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prompts 테이블
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  content text not null,
  preview text not null,
  category text not null check (category in ('WRITING','CODING','DESIGN','MARKETING','EDUCATION','ENTERTAINMENT','ETC')),
  price integer not null check (price >= 0),
  tags text[] not null default '{}',
  thumbnail_url text,
  view_count integer not null default 0,
  purchase_count integer not null default 0,
  rating_avg numeric(3,2) not null default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SOLD_OUT','DELETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purchases 테이블
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id) on delete cascade,
  seller_id uuid not null references public.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  price_paid integer not null check (price_paid >= 0),
  created_at timestamptz not null default now(),
  constraint unique_purchase unique (buyer_id, prompt_id)
);

-- ============================================
-- 인덱스
-- ============================================
create index idx_users_referral_code on public.users(referral_code);
create index idx_users_nickname on public.users(nickname);
create index idx_prompts_seller_id on public.prompts(seller_id);
create index idx_prompts_category on public.prompts(category);
create index idx_prompts_status on public.prompts(status);
create index idx_prompts_created_at on public.prompts(created_at desc);
create index idx_purchases_buyer_id on public.purchases(buyer_id);
create index idx_purchases_seller_id on public.purchases(seller_id);
create index idx_purchases_prompt_id on public.purchases(prompt_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_users_updated on public.users;
create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

drop trigger if exists on_prompts_updated on public.prompts;
create trigger on_prompts_updated
  before update on public.prompts
  for each row execute function public.handle_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
alter table public.users enable row level security;
alter table public.prompts enable row level security;
alter table public.purchases enable row level security;

-- Users: 누구나 읽기, 본인만 수정, 삽입은 자기 ID만
create policy "users_select" on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (auth.uid() = id);
create policy "users_update" on public.users for update using (auth.uid() = id);

-- Prompts: 누구나 ACTIVE 읽기, 판매자만 수정/삭제, 인증 사용자만 등록
create policy "prompts_select" on public.prompts for select using (status = 'ACTIVE' or auth.uid() = seller_id);
create policy "prompts_insert" on public.prompts for insert with check (auth.uid() = seller_id);
create policy "prompts_update" on public.prompts for update using (auth.uid() = seller_id);

-- Purchases: 구매자 또는 판매자만 조회, 인증 사용자만 삽입
create policy "purchases_select" on public.purchases for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "purchases_insert" on public.purchases for insert with check (auth.uid() = buyer_id);
