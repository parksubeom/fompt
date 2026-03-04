# 014 - Review/Rating System (Review & Rating System)

## 1. Goal

- Prompt detail page review/rating function
- Purchase review only (trust assurance)
- Average rating display + sort option
- Review CRUD (create/edit/delete) with atomic transaction
- StarRating reusable component

## 2. Reasoning & Decisions

### Why review system first?

After completing phases 001-013 (auth, prompt CRUD, purchase, profile, search), the marketplace was missing trust signals.
In a marketplace, buyers make purchase decisions based on other buyers' experiences.
`rating_avg` column already existed in the prompts table but was unused - this was the natural next step.

### Review access control design

| User state | Can write review | Can view reviews |
|------------|-----------------|-----------------|
| Not logged in | X | O |
| Logged in, not purchased | X | O |
| Logged in, purchased | O (1 review per prompt) | O |
| Prompt owner | X (cannot review own) | O |

Strict enforcement via DB-level RPC function, not just frontend checks:
- `purchase required` exception when no purchase record exists
- `cannot review own prompt` exception for self-review attempts
- `already reviewed` exception for duplicate reviews
- `unique_review (reviewer_id, prompt_id)` DB constraint as final safety net

### Atomic transaction for rating consistency

Rating average must always be consistent with actual review data.
If review insert and rating_avg update are separate operations, a failure between them causes data inconsistency.

Solution: `SECURITY DEFINER` RPC functions that atomically:
1. Validate permissions (purchase check, duplicate check)
2. Insert/Update/Delete the review
3. Recalculate `rating_avg` from all reviews via `AVG(rating)`

This pattern is consistent with the existing `purchase_prompt` RPC approach.

### StarRating component: dual mode design

Two use cases exist:
- **Display mode**: Show rating on cards/detail pages (non-interactive, fractional support)
- **Input mode**: Let users select a rating 1-5 (interactive, hover preview)

Single component with `interactive` prop avoids code duplication while maintaining clean API.
`size` prop (sm/md/lg) enables consistent sizing across different contexts.

### Review statistics bar

Rating distribution bar (5-star to 1-star breakdown) provides more information than just an average number.
Users can see if ratings are clustered or polarized.
Calculated client-side from loaded reviews to minimize additional API calls.

### Pagination: "load more" pattern

Consistent with the existing prompt list page pagination strategy.
`REVIEWS_PAGE_SIZE = 5` - smaller than prompt cards since reviews are text-heavy.
`range(from, to)` offset-based paging with "load more" button.

### Sort option: rating sort added to prompt list

Added `rating` sort option (`rating_avg DESC`) to the existing sort dropdown.
This allows users to discover highly-rated prompts, increasing marketplace trust.

## 3. Implementation Details

### 3-1. Files added/modified

| File | Change |
|------|--------|
| `supabase/migrations/003_reviews.sql` | **NEW** - reviews table, RLS, 3 RPC functions |
| `types/database.ts` | Review/ReviewInsert/ReviewUpdate/ReviewWithUser types added |
| `utils/constants.ts` | VALIDATION.REVIEW added (rating 1-5, comment max 500) |
| `utils/validation.ts` | `validateReviewRating`, `validateReviewComment` added |
| `components/features/review/StarRating.tsx` | **NEW** - Reusable star rating (display + input) |
| `components/features/review/ReviewSection.tsx` | **NEW** - Full review UI (list, form, edit, delete, stats) |
| `components/features/prompt/PromptCard.tsx` | Rating display added (star icon + score) |
| `app/prompts/[id]/page.tsx` | ReviewSection integrated, rating in stats card |
| `app/prompts/page.tsx` | "Rating" sort option added |

### 3-2. Database schema (003_reviews.sql)

```sql
reviews (
  id uuid PK,
  reviewer_id uuid FK -> users,
  prompt_id uuid FK -> prompts,
  rating integer CHECK (1-5),
  comment text DEFAULT '',
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (reviewer_id, prompt_id)
)
```

RLS policies:
- SELECT: public (anyone can read)
- INSERT: `auth.uid() = reviewer_id`
- UPDATE: `auth.uid() = reviewer_id`
- DELETE: `auth.uid() = reviewer_id`

### 3-3. RPC functions

| Function | Purpose | Validations |
|----------|---------|-------------|
| `submit_review` | Create review + recalculate avg | purchase check, self-review block, duplicate block, rating range |
| `update_review` | Edit review + recalculate avg | ownership check, rating range |
| `delete_review` | Remove review + recalculate avg | ownership check |

All functions use `SECURITY DEFINER` to bypass RLS for cross-table writes.

### 3-4. Review section layout

```
+------------------------------------------+
| [MessageSquare] Reviews (12)    * 4.2    |
+------------------------------------------+
| +--------------------------------------+ |
| |  4.2          5 **********  32       | |
| |  *****        4 *******    24        | |
| |  12 reviews   3 ****      15        | |
| |               2 **         8        | |
| |               1 *          3        | |
| +--------------------------------------+ |
+------------------------------------------+
| Review form (only for purchasers)        |
| [*****] Select rating                    |
| [Textarea] Comment (optional, max 500)   |
| [Submit button]                          |
+------------------------------------------+
| [Avatar] nickname  *****  3 days ago     |
|          Review comment text...    [Edit] |
+------------------------------------------+
| [Avatar] nickname2  ****  1 week ago     |
|          Another review...       [Delete] |
+------------------------------------------+
|            [Load more]                   |
+------------------------------------------+
```

### 3-5. User state UI mapping

| State | Review form | Review list | Actions |
|-------|------------|------------|---------|
| Not logged in | Hidden | Visible | None |
| Logged in, not purchased | Hidden | Visible | None |
| Purchased, no review yet | Visible | Visible | Submit |
| Purchased, already reviewed | "Already reviewed" notice | Visible | Edit/Delete own |
| Prompt owner | Hidden | Visible | None |

### 3-6. PromptCard rating display

```
[Avatar] nickname [tier]  *4.2  [eye]1.2K  [cart]45
```

Rating only shows when `rating_avg > 0` (no reviews = no star shown).
Amber-colored star icon with score to maintain visual hierarchy.

## 4. Reused infrastructure

| Existing code | Usage |
|---------------|-------|
| `TIERS` | Reviewer tier badge display |
| `formatRelativeTime()` | Review date display |
| `useAuthStore()` | Current user check for review permissions |
| `supabase` client | Review CRUD operations |
| `Avatar` component | Reviewer avatar in review list |
| `Card` component | Review cards and stats card |
| `Textarea` component | Review comment input |
| `Badge` component | "MY" badge for own review |
| `Button` component | Submit, edit, delete, load more |
| `handle_updated_at()` trigger | Reused for reviews.updated_at |

## 5. Migration instructions

Run in Supabase Dashboard SQL Editor:
```
supabase/migrations/003_reviews.sql
```

This creates:
- `reviews` table with indexes
- RLS policies (4 policies)
- 3 RPC functions (submit_review, update_review, delete_review)

## 6. Build result

- TypeScript compilation: OK (exit 0, `npx tsc --noEmit`)
- Next.js compile: OK ("Compiled successfully")
- Prerender errors: Pre-existing (Supabase env vars during static generation - not related to this change)
- Lint: No errors

## 7. Next Steps

- **015 - Profile edit**: Nickname/avatar update, settings page
- **016 - Landing page enhancement**: Featured prompts, trending, recent reviews
- **017 - Point transaction history**: Point ledger, earning/spending log
- **018 - Bookmark/favorites**: Save prompts for later
