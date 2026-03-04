'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  ChevronDown,
  Shield,
  ShieldOff,
  Loader2,
  UserCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { formatPoints, formatRelativeTime } from '@/utils/format'
import { TIERS } from '@/utils/constants'
import { toast } from 'sonner'
import type { User, UserTier } from '@/types/database'

const PAGE_SIZE = 20

type SortField = 'created_at' | 'points' | 'total_sales' | 'total_purchases'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null)

  const fetchUsers = useCallback(
    async (reset = false) => {
      setLoading(true)
      try {
        const currentPage = reset ? 0 : page
        const from = currentPage * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        let query = (supabase.from('users') as any).select('*', {
          count: 'exact',
        })

        if (searchQuery.trim()) {
          query = query.or(
            `nickname.ilike.%${searchQuery.trim()}%,email.ilike.%${searchQuery.trim()}%`
          )
        }

        query = query.order(sortField, { ascending: false }).range(from, to)

        const { data, count, error } = await query

        if (error) throw error

        if (reset) {
          setUsers(data || [])
          setPage(0)
        } else {
          setUsers((prev) => (currentPage === 0 ? data || [] : [...prev, ...(data || [])]))
        }

        setTotalCount(count || 0)
        setHasMore((data?.length || 0) === PAGE_SIZE)
      } catch (err) {
        console.error('Fetch users error:', err)
        toast.error('사용자 목록을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [page, searchQuery, sortField]
  )

  useEffect(() => {
    fetchUsers(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortField])

  const loadMore = () => {
    setPage((p) => p + 1)
  }

  useEffect(() => {
    if (page > 0) fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleToggleAdmin = async (targetUser: User) => {
    setTogglingAdmin(targetUser.id)
    try {
      const newStatus = !targetUser.is_admin
      const { error } = await (supabase.from('users') as any)
        .update({ is_admin: newStatus })
        .eq('id', targetUser.id)

      if (error) throw error

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, is_admin: newStatus } : u
        )
      )
      toast.success(
        newStatus
          ? `${targetUser.nickname}님에게 관리자 권한을 부여했습니다.`
          : `${targetUser.nickname}님의 관리자 권한을 해제했습니다.`
      )
    } catch {
      toast.error('권한 변경에 실패했습니다.')
    } finally {
      setTogglingAdmin(null)
    }
  }

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'created_at', label: '가입일순' },
    { value: 'points', label: '포인트순' },
    { value: 'total_sales', label: '판매수순' },
    { value: 'total_purchases', label: '구매수순' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          사용자 관리
          <span className="text-sm font-normal text-gray-400 ml-2">
            {totalCount}명
          </span>
        </h2>
      </div>

      {/* 검색 & 정렬 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="닉네임 또는 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {sortOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={sortField === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortField(opt.value)}
                  className={
                    sortField === opt.value
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : ''
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardContent className="p-0">
          {loading && users.length === 0 ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {users.map((u) => {
                const tierInfo = TIERS[u.tier as UserTier]
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={u.avatar_url || undefined}
                        alt={u.nickname}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-sm">
                        {u.nickname[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {u.nickname}
                        </p>
                        {u.is_admin && (
                          <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0">
                            ADMIN
                          </Badge>
                        )}
                        {tierInfo && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${tierInfo.colorClass}`}
                          >
                            {tierInfo.badge} {tierInfo.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {u.email}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      <div className="text-center">
                        <p className="font-semibold text-gray-700">
                          {formatPoints(u.points)}
                        </p>
                        <p>포인트</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700">
                          {u.total_sales}
                        </p>
                        <p>판매</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700">
                          {u.total_purchases}
                        </p>
                        <p>구매</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-gray-400">
                          {formatRelativeTime(u.created_at)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAdmin(u)}
                      disabled={togglingAdmin === u.id}
                      className={`flex-shrink-0 ${
                        u.is_admin
                          ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {togglingAdmin === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.is_admin ? (
                        <>
                          <ShieldOff className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline text-xs">해제</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline text-xs">관리자</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {/* 더보기 */}
          {hasMore && users.length > 0 && (
            <div className="p-4 text-center border-t">
              <Button
                variant="ghost"
                onClick={loadMore}
                disabled={loading}
                className="text-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                더보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
