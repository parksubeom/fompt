/**
 * Supabase Client
 * Singleton 패턴으로 Supabase 클라이언트 인스턴스 관리
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
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
 * Supabase 클라이언트 싱글톤 인스턴스
 */
let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Supabase 클라이언트 가져오기
 * 싱글톤 패턴으로 재사용
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseInstance
}

/**
 * 편의 함수: 기본 Supabase 클라이언트
 */
export const supabase = getSupabase()
