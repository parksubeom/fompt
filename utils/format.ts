/**
 * Formatting Utilities
 * 날짜, 숫자, 텍스트 포맷팅 함수
 */

/**
 * 포인트 표시 (1000 -> "1,000 F")
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString('ko-KR')} F`
}

/**
 * 상대 시간 표시 (예: "3분 전", "2일 전")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) return '방금 전'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`

  // 1주 이상이면 날짜 표시
  return target.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 절대 시간 표시 (2026.02.10 15:30)
 */
export function formatDateTime(date: string | Date): string {
  const target = typeof date === 'string' ? new Date(date) : date
  return target.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 숫자를 K, M 단위로 축약 (1500 -> "1.5K")
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  return `${(num / 1000000).toFixed(1)}M`
}

/**
 * 텍스트 말줄임 (50자 이상이면 "..." 추가)
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * 추천인 코드 생성 (8자리 대문자+숫자)
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
