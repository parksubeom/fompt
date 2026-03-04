# 016 - Bookmark / Notification / SEO

## 1. Goal

1. **Bookmark**: Prompt save/unsave with toggle, bookmarks page
2. **Notification**: Real-time bell with unread count, auto-generated on purchase/review
3. **SEO**: Enhanced metadata, OG tags, sitemap.xml, robots.txt

## 2. Reasoning & Decisions

### 2-1. Bookmark System

**DB Design**:
- Simple junction table: `bookmarks(user_id, prompt_id)` with UNIQUE constraint
- RLS: users can only SELECT/INSERT/DELETE their own bookmarks
- No UPDATE needed (bookmarks are binary: exist or not)

**Toggle UX**:
- Bookmark icon in prompt detail page header (next to title)
- Filled violet = bookmarked, outline gray = not bookmarked
- Only shows for logged-in users who are NOT the prompt owner (no self-bookmark)
- Optimistic UI: icon changes immediately, DB operation in background

**Bookmarks page** (`/bookmarks`):
- Reuses PromptCard grid component
- JOIN query: `bookmarks -> prompts -> users` to get PromptWithSeller data
- Filters out DELETED prompts client-side
- Empty state with CTA to browse prompts

### 2-2. Notification System

**Notification types**:
| Type | Trigger | Recipient |
|------|---------|-----------|
| PURCHASE_RECEIVED | Someone buys your prompt | Seller |
| REVIEW_RECEIVED | Someone reviews your prompt | Seller |
| WELCOME | User signup | New user |
| SYSTEM | Admin broadcast | Target user |

**Generation strategy**:
- Notifications are created inside existing RPC functions (`purchase_prompt`, `submit_review`)
- This ensures atomicity: if the purchase/review succeeds, the notification is guaranteed
- `SECURITY DEFINER` allows cross-table writes (notifications table blocks direct INSERT via RLS)
- Notification includes context: buyer name, prompt title (truncated to 30 chars), price/rating

**NotificationBell component**:
- Dropdown in header (between nav and points badge)
- Unread count badge (red circle, max "9+")
- Polls unread count every 30 seconds (`setInterval`)
- Full notification list loaded on dropdown open (lazy loading)
- "Mark all read" button calls `mark_notifications_read` RPC
- Each notification links to related prompt (via `related_id`)
- Visual distinction: unread items have violet-tinted background + blue dot

**Why polling instead of Supabase Realtime?**:
- Simpler implementation, no WebSocket connection management
- 30-second interval is acceptable for notification freshness
- Can upgrade to Realtime later without UI changes

### 2-3. SEO Optimization

**Root metadata** (`app/layout.tsx`):
- Title template: `%s | FOMPT` for child pages
- Korean locale OG tags
- Twitter card metadata
- Keywords for search engines

**Sitemap** (`app/sitemap.ts`):
- Static pages: home, prompts, login, signup
- Priority-based: home(1.0) > prompts(0.9) > auth pages(0.5)
- Could be extended to include individual prompt pages with DB query

**Robots** (`app/robots.ts`):
- Allow public pages
- Disallow private pages: profile, settings, points, bookmarks, purchases, auth callback

**Prompts layout** (`app/prompts/layout.tsx`):
- Page-specific metadata for the prompts market page
- OG tags optimized for sharing prompt market links

## 3. Implementation Details

### Files added/modified

| File | Change |
|------|--------|
| `supabase/migrations/005_bookmarks_notifications.sql` | **NEW** - bookmarks + notifications tables, updated RPCs |
| `types/database.ts` | Bookmark, Notification types, Database schema |
| `utils/constants.ts` | `ROUTES.BOOKMARKS` added |
| `app/bookmarks/page.tsx` | **NEW** - Bookmarked prompts grid page |
| `app/prompts/[id]/page.tsx` | Bookmark toggle button in header |
| `components/features/notification/NotificationBell.tsx` | **NEW** - Bell dropdown with notifications |
| `components/layout/Header.tsx` | NotificationBell + bookmark dropdown item |
| `app/layout.tsx` | Enhanced metadata with OG, Twitter, keywords |
| `app/sitemap.ts` | **NEW** - Sitemap generation |
| `app/robots.ts` | **NEW** - Robots.txt rules |
| `app/prompts/layout.tsx` | **NEW** - Prompts page metadata |

### Notification flow

```
User A buys prompt from User B
  -> purchase_prompt RPC
    -> ... existing purchase logic ...
    -> INSERT INTO notifications (
         user_id = User B,
         type = 'PURCHASE_RECEIVED',
         title = '프롬프트가 판매되었습니다!',
         message = 'UserA님이 "Prompt Title"을(를) 구매했습니다. (+100 F)'
       )

User B opens header
  -> NotificationBell polls unread count (every 30s)
  -> Red badge shows "1"

User B clicks bell
  -> Dropdown opens, loads full notification list
  -> Unread item highlighted with violet bg + dot

User B clicks "모두 읽음"
  -> mark_notifications_read RPC
  -> All items marked read, badge disappears
```

### Bookmark flow

```
User visits /prompts/[id]
  -> checkBookmark() queries bookmarks table
  -> Bookmark icon shows filled/outline state

User clicks bookmark icon
  -> INSERT/DELETE bookmarks row
  -> Icon toggles immediately

User visits /bookmarks
  -> JOIN query: bookmarks -> prompts -> users
  -> PromptCard grid display
```

## 4. Migration instructions

Run in Supabase Dashboard SQL Editor:
```
supabase/migrations/005_bookmarks_notifications.sql
```

This creates:
- `bookmarks` table with RLS (3 policies)
- `notifications` table with RLS (2 policies + 1 block)
- Updated `purchase_prompt` (now creates seller notification)
- Updated `submit_review` (now creates seller notification)
- `mark_notifications_read` RPC function

## 5. Build result

- TypeScript: OK (exit 0)
- Lint: No errors

## 6. Next Steps

- **017 - Supabase Realtime notifications**: WebSocket-based push
- **018 - Image upload**: Supabase Storage for avatar/thumbnail
- **019 - Admin dashboard**: User/prompt management, stats
