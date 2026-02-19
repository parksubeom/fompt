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

async function resolveUniqueNickname(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  baseNickname: string,
): Promise<string> {
  const { data: existing } = await (supabase.from('users') as any)
    .select('id')
    .eq('nickname', baseNickname)
    .maybeSingle()

  if (!existing) return baseNickname

  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    const candidate = `${baseNickname.slice(0, 15)}_${suffix}`

    const { data: dup } = await (supabase.from('users') as any)
      .select('id')
      .eq('nickname', candidate)
      .maybeSingle()

    if (!dup) return candidate
  }

  return `${baseNickname.slice(0, 12)}_${Date.now().toString(36)}`
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
    const rawNickname = deriveNickname(
      authUser.email,
      authUser.user_metadata?.full_name as string | null,
    )
    const nickname = await resolveUniqueNickname(supabase, rawNickname)

    const profile: UserInsert = {
      id: authUser.id,
      email: authUser.email ?? '',
      nickname,
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
