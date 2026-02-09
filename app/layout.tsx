import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: "FOMPT - 네 아이디어, 폼 나게 팔자",
  description: "한국어 프롬프트 마켓플레이스",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: 실제 사용자 정보는 Supabase에서 가져오기 (현재는 데모용 null)
  const user = null

  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col">
        <Header user={user} onLogout={() => console.log('Logout')} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
