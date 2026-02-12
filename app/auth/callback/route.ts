import { NextResponse } from 'next/server'
import type { UserInsert } from '@/types/database'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { POINTS, ROUTES } from '@/utils/constants'
import { generateReferralCode } from '@/utils/format'

function deriveNickname(email?: string, fullName?: string | null) {
  if (fullName && fullName.trim().length >= 2) {
    return fullName.trim().slice(0, 20)
  }

  const local = email?.split('@')[0] ?? 'fompt_user'
  return local.slice(0, 20)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=oauth-code-missing`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=oauth-exchange-failed`)
  }

  const authUser = data.user
  const { data: existingUser } = await (supabase.from('users') as any)
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle()

  if (!existingUser) {
    const profile: UserInsert = {
      id: authUser.id,
      email: authUser.email ?? '',
      nickname: deriveNickname(authUser.email, authUser.user_metadata?.full_name as string | null),
      avatar_url: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
      points: POINTS.SIGNUP_BONUS,
      referral_code: generateReferralCode(),
      referred_by: null,
      tier: 'BRONZE',
      total_sales: 0,
      total_purchases: 0,
    }

    await (supabase.from('users') as any).insert(profile)
  }

  return NextResponse.redirect(`${origin}${ROUTES.HOME}`)
}
