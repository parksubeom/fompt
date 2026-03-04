'use client'

/**
 * Global Header Component
 * 로고, 포인트 뱃지, 프로필 드롭다운 표시
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogIn, User, Settings, LogOut, ShoppingBag, Plus, Wallet, Bookmark, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/utils/constants'
import { formatPoints } from '@/utils/format'
import { TIERS } from '@/utils/constants'
import { NotificationBell } from '@/components/features/notification/NotificationBell'
import type { User as UserType } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
  user: UserType | null
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace(ROUTES.HOME)
    router.refresh()
  }

  // 로고 그라데이션 스타일
  const logoGradient =
    'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* 왼쪽: 로고 */}
        <Link href={ROUTES.HOME} className="flex items-center space-x-2">
          <h1 className={`text-2xl font-bold ${logoGradient}`}>FOMPT</h1>
        </Link>

        {/* 중앙: 네비게이션 (선택적) */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href={ROUTES.PROMPTS}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === ROUTES.PROMPTS ? 'text-primary' : 'text-gray-600'
            }`}
          >
            프롬프트 둘러보기
          </Link>
          {user && (
            <Link
              href={ROUTES.PROMPT_CREATE}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === ROUTES.PROMPT_CREATE
                  ? 'text-primary'
                  : 'text-gray-600'
              }`}
            >
              프롬프트 판매하기
            </Link>
          )}
        </nav>

        {/* 오른쪽: 로그인 상태별 UI */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* 알림 벨 */}
              <NotificationBell userId={user.id} />

              {/* 포인트 뱃지 */}
              <Link href={ROUTES.POINTS}>
                <Badge
                  variant="secondary"
                  className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-violet-50 to-cyan-50 text-primary border-primary/20 cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <span className="text-base font-bold">
                    {formatPoints(user.points)}
                  </span>
                </Badge>
              </Link>

              {/* 프로필 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user.avatar_url || undefined}
                        alt={user.nickname}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                        {user.nickname[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* 등급 뱃지 */}
                    <span className="absolute -bottom-1 -right-1 text-xs">
                      {TIERS[user.tier].badge}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.nickname}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${TIERS[user.tier].colorClass}`}
                        >
                          {TIERS[user.tier].badge} {TIERS[user.tier].label}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatPoints(user.points)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.PROFILE}
                      className="flex items-center cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>프로필</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.PURCHASES}
                      className="flex items-center cursor-pointer"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>구매 내역</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.PROMPT_CREATE}
                      className="flex items-center cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>프롬프트 등록</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.BOOKMARKS}
                      className="flex items-center cursor-pointer"
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>즐겨찾기</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.POINTS}
                      className="flex items-center cursor-pointer"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>포인트 내역</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.SETTINGS}
                      className="flex items-center cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>설정</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* 비로그인 상태: 로그인 버튼 */}
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href={ROUTES.LOGIN}>
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Link>
              </Button>

              {/* 시작하기 버튼 (그라데이션) */}
              <Button asChild className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90">
                <Link href={ROUTES.SIGNUP}>시작하기</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 모바일 네비게이션 (sm 이하) */}
      {user && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto flex items-center justify-around px-4 py-2">
            <Link
              href={ROUTES.PROMPTS}
              className={`flex flex-col items-center text-xs ${
                pathname === ROUTES.PROMPTS ? 'text-primary' : 'text-gray-600'
              }`}
            >
              <ShoppingBag className="h-5 w-5 mb-1" />
              <span>둘러보기</span>
            </Link>
            <Link
              href={ROUTES.PROMPT_CREATE}
              className={`flex flex-col items-center text-xs ${
                pathname === ROUTES.PROMPT_CREATE
                  ? 'text-primary'
                  : 'text-gray-600'
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              <span>판매하기</span>
            </Link>
            <div className="flex flex-col items-center text-xs text-primary">
              <div className="h-5 w-5 mb-1 flex items-center justify-center text-base">
                💰
              </div>
              <span>{formatPoints(user.points)}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
