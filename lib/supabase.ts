import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
  )
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
)

export function getSupabase() {
  return supabase
}
