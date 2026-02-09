/**
 * Auth Layout
 * 인증 관련 페이지의 공통 레이아웃
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
