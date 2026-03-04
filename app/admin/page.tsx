'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  FileText,
  ShoppingCart,
  Star,
  TrendingUp,
  Coins,
  UserPlus,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { formatPoints, formatCompactNumber } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

interface AdminStats {
  totalUsers: number
  totalPrompts: number
  activePrompts: number
  totalPurchases: number
  totalReviews: number
  totalPointsCirculation: number
  todaySignups: number
  todayPurchases: number
}

interface RecentUser {
  id: string
  nickname: string
  email: string
  tier: string
  points: number
  created_at: string
}

interface RecentPrompt {
  id: string
  title: string
  category: string
  price: number
  purchase_count: number
  status: string
  created_at: string
  seller: { nickname: string }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, promptsRes] = await Promise.all([
          (supabase.rpc as any)('admin_get_stats'),
          (supabase.from('users') as any)
            .select('id, nickname, email, tier, points, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          (supabase.from('prompts') as any)
            .select('id, title, category, price, purchase_count, status, created_at, seller:users!seller_id(nickname)')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        if (statsRes.data) setStats(statsRes.data as AdminStats)
        if (usersRes.data) setRecentUsers(usersRes.data)
        if (promptsRes.data) setRecentPrompts(promptsRes.data)
      } catch (err) {
        console.error('Admin data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const statCards = stats
    ? [
        {
          label: '전체 사용자',
          value: formatCompactNumber(stats.totalUsers),
          icon: Users,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          label: '전체 프롬프트',
          value: formatCompactNumber(stats.totalPrompts),
          icon: FileText,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
        },
        {
          label: '활성 프롬프트',
          value: formatCompactNumber(stats.activePrompts),
          icon: TrendingUp,
          color: 'text-green-600',
          bg: 'bg-green-50',
        },
        {
          label: '총 거래',
          value: formatCompactNumber(stats.totalPurchases),
          icon: ShoppingCart,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
        },
        {
          label: '총 리뷰',
          value: formatCompactNumber(stats.totalReviews),
          icon: Star,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
        },
        {
          label: '유통 포인트',
          value: formatPoints(stats.totalPointsCirculation),
          icon: Coins,
          color: 'text-cyan-600',
          bg: 'bg-cyan-50',
        },
        {
          label: '오늘 가입',
          value: stats.todaySignups.toString(),
          icon: UserPlus,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
        },
        {
          label: '오늘 거래',
          value: stats.todayPurchases.toString(),
          icon: ArrowUpRight,
          color: 'text-rose-600',
          bg: 'bg-rose-50',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">대시보드 개요</h2>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">{card.label}</p>
                    <p className="text-lg font-bold truncate">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 가입 사용자 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">최근 가입 사용자</CardTitle>
              <Link
                href={ROUTES.ADMIN_USERS}
                className="text-xs text-primary hover:underline"
              >
                전체 보기
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                데이터가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.nickname}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {u.email}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{u.tier}</p>
                      <p className="text-xs text-gray-400">
                        {formatPoints(u.points)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 등록 프롬프트 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">최근 등록 프롬프트</CardTitle>
              <Link
                href={ROUTES.ADMIN_PROMPTS}
                className="text-xs text-primary hover:underline"
              >
                전체 보기
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentPrompts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                데이터가 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {recentPrompts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {p.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.seller?.nickname} · {formatPoints(p.price)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-600'
                            : p.status === 'DELETED'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.status === 'ACTIVE'
                          ? '활성'
                          : p.status === 'DELETED'
                          ? '삭제됨'
                          : '품절'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
