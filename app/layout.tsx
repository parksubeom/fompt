import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { User as AppUser } from "@/types/database"

export const metadata: Metadata = {
  title: {
    default: 'FOMPT - 네 아이디어, 폼 나게 팔자',
    template: '%s | FOMPT',
  },
  description: 'AI 프롬프트를 사고파는 한국어 마켓플레이스. 가입하면 100 포인트 지급! 현금 없이 포인트로만 거래하세요.',
  keywords: ['프롬프트', 'AI', 'ChatGPT', '마켓플레이스', '프롬프트 마켓', 'FOMPT', '한국어 프롬프트'],
  authors: [{ name: 'FOMPT' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'FOMPT',
    title: 'FOMPT - 네 아이디어, 폼 나게 팔자',
    description: 'AI 프롬프트를 사고파는 한국어 마켓플레이스. 가입하면 100 포인트 지급!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOMPT - 네 아이디어, 폼 나게 팔자',
    description: 'AI 프롬프트를 사고파는 한국어 마켓플레이스',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let user: AppUser | null = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    user = data ?? null
  }

  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col">
        <AuthProvider serverUser={user}>
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
