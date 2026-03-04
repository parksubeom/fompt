'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Mail,
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  Key,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { TIERS, ROUTES } from '@/utils/constants'
import { validateNickname } from '@/utils/validation'
import { formatRelativeTime } from '@/utils/format'
import Link from 'next/link'

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, setUser } = useAuthStore()

  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')

  const [nicknameError, setNicknameError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [profileSaveStatus, setProfileSaveStatus] = useState<SaveStatus>('idle')
  const [profileSaveMessage, setProfileSaveMessage] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaveStatus, setPasswordSaveStatus] = useState<SaveStatus>('idle')
  const [passwordSaveMessage, setPasswordSaveMessage] = useState('')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`${ROUTES.LOGIN}?redirect=/settings`)
      return
    }
    setNickname(user.nickname)
    setAvatarUrl(user.avatar_url || '')
    setAvatarPreview(user.avatar_url || '')
  }, [user, authLoading, router])

  const handleAvatarUrlChange = (url: string) => {
    setAvatarUrl(url)
    setAvatarError('')

    if (url && !url.match(/^https?:\/\/.+/)) {
      setAvatarError('올바른 URL 형식이 아닙니다. (https://...)')
      setAvatarPreview('')
      return
    }
    setAvatarPreview(url)
  }

  const handleProfileSave = async () => {
    if (!user) return

    const nicknameResult = validateNickname(nickname.trim())
    if (!nicknameResult.isValid) {
      setNicknameError(nicknameResult.error!)
      return
    }

    if (avatarUrl && !avatarUrl.match(/^https?:\/\/.+/)) {
      setAvatarError('올바른 URL 형식이 아닙니다.')
      return
    }

    setNicknameError('')
    setAvatarError('')
    setProfileSaveStatus('saving')
    setProfileSaveMessage('')

    try {
      const trimmedNickname = nickname.trim()

      if (trimmedNickname !== user.nickname) {
        const { data: existing } = await (supabase.from('users') as any)
          .select('id')
          .eq('nickname', trimmedNickname)
          .neq('id', user.id)
          .maybeSingle()

        if (existing) {
          setNicknameError('이미 사용 중인 닉네임입니다.')
          setProfileSaveStatus('idle')
          return
        }
      }

      const updateData: Record<string, any> = {
        nickname: trimmedNickname,
        avatar_url: avatarUrl.trim() || null,
      }

      const { error } = await (supabase.from('users') as any)
        .update(updateData)
        .eq('id', user.id)

      if (error) {
        if (error.message?.includes('unique') || error.code === '23505') {
          setNicknameError('이미 사용 중인 닉네임입니다.')
          setProfileSaveStatus('idle')
          return
        }
        throw error
      }

      setUser({ ...user, nickname: trimmedNickname, avatar_url: avatarUrl.trim() || null })
      setProfileSaveStatus('success')
      setProfileSaveMessage('프로필이 업데이트되었습니다.')
      toast.success('프로필이 업데이트되었습니다.')
      setTimeout(() => setProfileSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Profile update error:', err)
      setProfileSaveStatus('error')
      setProfileSaveMessage('프로필 업데이트에 실패했습니다.')
      toast.error('프로필 업데이트에 실패했습니다.')
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSaveMessage('')

    if (!newPassword) {
      setPasswordError('새 비밀번호를 입력해주세요.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }
    if (newPassword.length > 50) {
      setPasswordError('비밀번호는 최대 50자까지 가능합니다.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setPasswordSaveStatus('saving')

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setPasswordError(error.message || '비밀번호 변경에 실패했습니다.')
        setPasswordSaveStatus('error')
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSaveStatus('success')
      setPasswordSaveMessage('비밀번호가 변경되었습니다.')
      toast.success('비밀번호가 변경되었습니다.')
      setTimeout(() => setPasswordSaveStatus('idle'), 3000)
    } catch {
      setPasswordError('예상치 못한 오류가 발생했습니다.')
      setPasswordSaveStatus('error')
    }
  }

  const hasProfileChanges =
    user &&
    (nickname.trim() !== user.nickname || (avatarUrl.trim() || null) !== (user.avatar_url || null))

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const tierInfo = TIERS[user.tier]

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Link
          href={ROUTES.PROFILE}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          프로필로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-sm text-gray-500 mt-1">프로필 정보를 수정하고 계정을 관리하세요.</p>
      </div>

      <div className="space-y-6">
        {/* 프로필 편집 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              프로필 편집
            </CardTitle>
            <CardDescription>다른 사용자에게 보이는 프로필 정보를 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 아바타 미리보기 */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarPreview || undefined} alt={nickname} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                    {(nickname || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <Camera className="h-3 w-3 text-gray-500" />
                </div>
              </div>
              <div>
                <p className="font-medium">{user.nickname}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-xs ${tierInfo.colorClass}`}>
                    {tierInfo.badge} {tierInfo.label}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    가입일: {formatRelativeTime(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* 이메일 (읽기 전용) */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                이메일
              </Label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400">이메일은 변경할 수 없습니다.</p>
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-sm text-gray-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                닉네임
              </Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setNicknameError('')
                }}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                className={nicknameError ? 'border-red-300 focus-visible:ring-red-300' : ''}
              />
              <div className="flex items-center justify-between">
                {nicknameError ? (
                  <p className="text-xs text-red-500">{nicknameError}</p>
                ) : (
                  <p className="text-xs text-gray-400">
                    2~20자, 한글/영문/숫자/언더스코어
                  </p>
                )}
                <span className="text-xs text-gray-400">{nickname.length}/20</span>
              </div>
            </div>

            {/* 아바타 URL */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-sm text-gray-600 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                프로필 이미지 URL
              </Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => handleAvatarUrlChange(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className={avatarError ? 'border-red-300 focus-visible:ring-red-300' : ''}
              />
              {avatarError ? (
                <p className="text-xs text-red-500">{avatarError}</p>
              ) : (
                <p className="text-xs text-gray-400">
                  프로필 사진 URL을 입력하세요. 비워두면 기본 아바타가 표시됩니다.
                </p>
              )}
            </div>

            {/* 저장 결과 메시지 */}
            {profileSaveMessage && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  profileSaveStatus === 'success'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {profileSaveStatus === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {profileSaveMessage}
              </div>
            )}

            {/* 저장 버튼 */}
            <Button
              onClick={handleProfileSave}
              disabled={profileSaveStatus === 'saving' || !hasProfileChanges}
              className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
            >
              {profileSaveStatus === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  프로필 저장
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-gray-500" />
              비밀번호 변경
            </CardTitle>
            <CardDescription>
              이메일로 가입한 경우에만 비밀번호를 변경할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm text-gray-600">
                새 비밀번호
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordError('')
                }}
                placeholder="새 비밀번호 (8자 이상)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-gray-600">
                비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setPasswordError('')
                }}
                placeholder="새 비밀번호 재입력"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {passwordError}
              </p>
            )}

            {passwordSaveMessage && passwordSaveStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {passwordSaveMessage}
              </div>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={passwordSaveStatus === 'saving' || !newPassword}
              variant="outline"
            >
              {passwordSaveStatus === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  변경 중...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  비밀번호 변경
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 계정 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-500" />
              계정 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-500">계정 ID</span>
                <code className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                  {user.id.substring(0, 8)}...
                </code>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-500">등급</span>
                <Badge variant="outline" className={tierInfo.colorClass}>
                  {tierInfo.badge} {tierInfo.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-500">추천인 코드</span>
                <code className="font-mono text-xs bg-gray-50 px-2 py-1 rounded tracking-wider">
                  {user.referral_code}
                </code>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">가입일</span>
                <span className="text-gray-700">{formatRelativeTime(user.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 계정 삭제 영역 */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              위험 구역
            </CardTitle>
            <CardDescription>
              계정 삭제는 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                계정 삭제
              </Button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
                <p className="text-sm text-red-600">
                  정말 계정을 삭제하시겠습니까? 등록한 프롬프트, 구매 내역, 리뷰 등
                  모든 데이터가 삭제되며 복구할 수 없습니다.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    취소
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      alert('계정 삭제 기능은 관리자에게 문의해주세요.')
                      setShowDeleteConfirm(false)
                    }}
                  >
                    계정 삭제
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
