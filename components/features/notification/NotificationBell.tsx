'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  ShoppingCart,
  MessageSquare,
  Gift,
  Info,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/utils/constants'
import { formatRelativeTime } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import type { Notification, NotificationType } from '@/types/database'

interface NotificationBellProps {
  userId: string
}

const NOTIF_ICON: Record<NotificationType, { icon: React.ElementType; colorClass: string }> = {
  PURCHASE_RECEIVED: { icon: ShoppingCart, colorClass: 'text-green-500' },
  REVIEW_RECEIVED: { icon: MessageSquare, colorClass: 'text-blue-500' },
  WELCOME: { icon: Gift, colorClass: 'text-violet-500' },
  SYSTEM: { icon: Info, colorClass: 'text-gray-500' },
}

const MAX_DISPLAY = 8

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await (supabase.from('notifications') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_DISPLAY)

      if (!error && data) {
        setNotifications(data as Notification[])
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
      }
    } catch {
      console.error('Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const fetchUnreadCount = useCallback(async () => {
    const { count } = await (supabase.from('notifications') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (count !== null) setUnreadCount(count)
  }, [userId])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    if (isOpen) fetchNotifications()
  }, [isOpen, fetchNotifications])

  const handleMarkAllRead = async () => {
    try {
      await (supabase.rpc as any)('mark_notifications_read', {
        p_user_id: userId,
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      console.error('Failed to mark notifications read')
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">알림</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              모두 읽음
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">알림이 없습니다</p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.map((notif) => {
              const info = NOTIF_ICON[notif.type]
              const IconComp = info.icon
              return (
                <div
                  key={notif.id}
                  className={`px-3 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors ${
                    !notif.is_read ? 'bg-violet-50/40' : ''
                  }`}
                >
                  {notif.related_id ? (
                    <Link
                      href={ROUTES.PROMPT_DETAIL(notif.related_id)}
                      className="block"
                      onClick={() => setIsOpen(false)}
                    >
                      <NotifContent notif={notif} IconComp={IconComp} info={info} />
                    </Link>
                  ) : (
                    <NotifContent notif={notif} IconComp={IconComp} info={info} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotifContent({
  notif,
  IconComp,
  info,
}: {
  notif: Notification
  IconComp: React.ElementType
  info: { colorClass: string }
}) {
  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 mt-0.5 ${info.colorClass}`}>
        <IconComp className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${!notif.is_read ? 'font-medium' : 'text-gray-700'}`}>
          {notif.title}
        </p>
        {notif.message && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">
          {formatRelativeTime(notif.created_at)}
        </p>
      </div>
      {!notif.is_read && (
        <div className="flex-shrink-0 mt-1.5">
          <div className="h-2 w-2 rounded-full bg-violet-500" />
        </div>
      )}
    </div>
  )
}
