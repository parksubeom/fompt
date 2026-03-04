# 015 - Landing Page / Profile Edit / Point History

## 1. Goal

Three production features in one phase:
1. **Landing page enhancement**: Dynamic content with trending/latest prompts, reviews, categories, stats
2. **Profile edit (Settings page)**: Nickname, avatar URL, password change
3. **Point transaction history**: Full ledger with filter, summary, pagination

## 2. Reasoning & Decisions

### 2-1. Landing Page (app/page.tsx)

**Problem**: The landing page was completely static - Hero, Features, CTA only. No real content to engage visitors.

**Solution**: Convert to client component that fetches live data on mount.

| Section | Data source | Purpose |
|---------|------------|---------|
| Hero | Auth state | CTA changes based on login status |
| Platform stats | users count, prompts count | Social proof |
| Trending prompts | `prompts ORDER BY purchase_count DESC LIMIT 4` | Discovery |
| Latest prompts | `prompts ORDER BY created_at DESC LIMIT 4` | Freshness |
| Category showcase | Category counts from prompts | Navigation |
| Recent reviews | `reviews WHERE rating >= 4 LIMIT 3` | Trust signals |
| Features | Static | Value proposition |
| CTA | Auth state | Conversion |

**Why client component?**: Consistent with the rest of the app. All other data-fetching pages (prompts, profile) are client components. Server component would require different error handling and Supabase client setup.

**Performance**: 5 parallel Supabase queries via `Promise.all()` - no waterfall fetching. Each query is lightweight (LIMIT 3-4).

**Auth-aware CTA**: Logged-in users see "프롬프트 판매하기" instead of "무료로 시작하기" - reduces friction for existing users.

### 2-2. Settings Page (app/settings/page.tsx)

**Design decisions**:
- Separated from profile page (/profile shows data, /settings edits data)
- Four distinct cards: Profile Edit, Password Change, Account Info, Danger Zone
- `ROUTES.SETTINGS` was already defined in constants but had no page

**Nickname edit flow**:
1. Client-side validation via existing `validateNickname()`
2. Uniqueness check: SELECT before UPDATE to give specific error message
3. DB-level `UNIQUE` constraint on `nickname` as safety net
4. Zustand store update via `setUser()` for immediate UI reflection

**Avatar URL approach**:
- URL input rather than file upload (no Supabase Storage bucket configured)
- Live preview via Avatar component
- Accepts any https:// URL (works with Google OAuth avatars, Gravatar, etc.)
- Empty = falls back to initial-based gradient avatar

**Password change**:
- Uses `supabase.auth.updateUser({ password })` - Supabase handles securely
- Only works for email-based accounts (OAuth users can set a password for future email login)
- Confirmation field prevents typos

**Account deletion**:
- Implemented as a placeholder with admin contact
- Real deletion requires careful cascade handling (prompts, reviews, purchases)
- Danger Zone card with red border for visual warning

### 2-3. Point Transaction History (app/points/page.tsx)

**Problem**: No visibility into point flow. Users don't know where their points came from or went.

**Solution**: New `point_transactions` table as an append-only ledger.

**DB design**:
```sql
point_transactions (
  id, user_id, type, amount, balance_after, description, related_id, created_at
)
```

Key decisions:
- `balance_after`: Snapshot of user's points after this transaction. Enables auditing without recalculating from scratch.
- `related_id`: Links to the prompt_id for PURCHASE/SALE transactions. Enables "what was this transaction for?" queries.
- `amount`: Positive for income (SALE, SIGNUP, REFERRAL), negative for expense (PURCHASE). Single column simplifies SUM queries.
- RLS: Only the user can see their own transactions. INSERT is blocked by policy - only RPC functions can insert.

**Updated purchase_prompt RPC**:
The existing `purchase_prompt` function was extended to automatically record two point_transactions entries:
1. Buyer: negative amount (PURCHASE type)
2. Seller: positive amount (SALE type)

Both include `balance_after` snapshots for audit trail.

**Frontend**:
- Summary cards: Current balance, total income, total expense
- Filter by type (ALL/SIGNUP/PURCHASE/SALE/REFERRAL)
- Each transaction shows: icon, type badge, description, relative time, amount, balance after
- Income shown in green with ArrowDownLeft, expense in red with ArrowUpRight
- Pagination: 20 per page with "load more"

**Header integration**:
- Points badge in header now links to /points page
- New "포인트 내역" item added to profile dropdown menu

## 3. Implementation Details

### Files added/modified

| File | Change |
|------|--------|
| `app/page.tsx` | **Rewritten** - Dynamic landing with 7 sections |
| `app/settings/page.tsx` | **NEW** - Profile edit, password change, account info |
| `app/points/page.tsx` | **NEW** - Point transaction history with filter |
| `app/profile/page.tsx` | Added "프로필 편집" button linking to /settings |
| `components/layout/Header.tsx` | Points badge links to /points, added 포인트 내역 dropdown item |
| `utils/constants.ts` | Added `ROUTES.POINTS`, `VALIDATION.REVIEW` |
| `types/database.ts` | Added PointTransactionRecord, PointTransactionInsert types |
| `supabase/migrations/004_point_transactions.sql` | **NEW** - point_transactions table + updated purchase_prompt RPC |

### Landing page layout

```
+--------------------------------------------+
| [gradient background]                      |
| Korean Prompt Marketplace badge            |
| FOMPT (gradient text)                      |
| 네 아이디어, 폼 나게 팔자                    |
| [CTA buttons - auth aware]                 |
+--------------------------------------------+
| N prompts | N users | 100% points          |
+--------------------------------------------+
| 🔥 인기 프롬프트         [전체보기 >]        |
| [Card] [Card] [Card] [Card]               |
+--------------------------------------------+
| 🕐 최신 프롬프트         [전체보기 >]        |
| [Card] [Card] [Card] [Card]               |
+--------------------------------------------+
| 📊 카테고리별 탐색                          |
| [✍️글쓰기 N개] [💻코딩 N개] [🎨디자인 N개]  |
| [📢마케팅 N개] [📚교육 N개] ...             |
+--------------------------------------------+
| ⭐ 최근 리뷰                               |
| [Review card] [Review card] [Review card]  |
+--------------------------------------------+
| 왜 FOMPT인가요?                            |
| [Feature] [Feature] [Feature]              |
+--------------------------------------------+
| [Gradient CTA banner]                      |
+--------------------------------------------+
```

### Settings page layout

```
+----------------------------------+
| ← 프로필로 돌아가기               |
| 설정                             |
+----------------------------------+
| 👤 프로필 편집                    |
| [Avatar preview]                 |
| 이메일 (readonly)                |
| 닉네임 [input] 0/20             |
| 프로필 이미지 URL [input]         |
| [프로필 저장]                     |
+----------------------------------+
| 🔑 비밀번호 변경                  |
| 새 비밀번호 [input]              |
| 비밀번호 확인 [input]            |
| [비밀번호 변경]                   |
+----------------------------------+
| 🛡 계정 정보                      |
| 계정 ID | abc123...              |
| 등급 | 🥉 브론즈                  |
| 추천인 코드 | A3X9K2L7           |
| 가입일 | 3일 전                   |
+----------------------------------+
| ⚠️ 위험 구역                      |
| [계정 삭제]                       |
+----------------------------------+
```

### Point history layout

```
+----------------------------------+
| ← 프로필로 돌아가기               |
| 💰 포인트 내역                    |
+----------------------------------+
| [보유 N F] [수입 +N F] [지출 -N F]|
+----------------------------------+
| [필터: 전체 ▼]         총 N건     |
+----------------------------------+
| 🎁 가입 보너스  SIGNUP            |
|    가입 보너스        3일 전       |
|              +100 F  잔액 100 F   |
+----------------------------------+
| 🛒 프롬프트 구매  PURCHASE        |
|    프롬프트 구매       2일 전      |
|               -50 F  잔액 50 F    |
+----------------------------------+
| [더 보기]                         |
+----------------------------------+
```

## 4. Migration instructions

Run in Supabase Dashboard SQL Editor:
```
supabase/migrations/004_point_transactions.sql
```

This creates:
- `point_transactions` table with indexes and RLS
- Updated `purchase_prompt` function (now records point transaction entries)

**Note**: Existing purchases before this migration won't have point_transaction records. Only new purchases going forward will be tracked.

## 5. Build result

- TypeScript compilation: OK (exit 0)
- Lint: No errors
- Prerender errors: Pre-existing (Supabase env vars)

## 6. Next Steps

- **016 - Bookmark/Favorites**: Save prompts for later
- **017 - Notification system**: Purchase/review notifications
- **018 - SEO optimization**: Meta tags, OG images, sitemap
