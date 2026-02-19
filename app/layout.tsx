import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { User as AppUser } from "@/types/database"

export const metadata: Metadata = {
  title: "FOMPT - 네 아이디어, 폼 나게 팔자",
  description: "한국어 프롬프트 마켓플레이스",
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
