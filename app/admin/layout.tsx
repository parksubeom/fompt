'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import { ROUTES } from '@/utils/constants'

const adminNavItems = [
  {
    href: ROUTES.ADMIN,
    label: '대시보드',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: ROUTES.ADMIN_USERS,
    label: '사용자 관리',
    icon: Users,
    exact: false,
  },
  {
    href: ROUTES.ADMIN_PROMPTS,
    label: '프롬프트 관리',
    icon: FileText,
    exact: false,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (item: (typeof adminNavItems)[0]) => {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-6">
        {/* 관리자 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">관리자 패널</h1>
              <p className="text-xs text-gray-500">FOMPT Administration</p>
            </div>
          </div>
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            서비스로 돌아가기
          </Link>
        </div>

        <div className="flex gap-6">
          {/* 사이드 네비게이션 */}
          <nav className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-red-600' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* 모바일 네비게이션 */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-red-50 text-red-700'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  )
}
