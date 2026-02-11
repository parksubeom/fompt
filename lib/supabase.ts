/**
 * Supabase Client
 * Singleton 패턴으로 Supabase 클라이언트 인스턴스 관리
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 환경변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
  )
}

/**
 * 모듈 스코프에서 한 번만 생성되는 클라이언트 인스턴스
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export function getSupabase() {
  return supabase
}
