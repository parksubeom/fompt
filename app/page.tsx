import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, TrendingUp, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 md:py-32">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent text-center mb-6">
          FOMPT
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 text-center mb-4">
          네 아이디어, 폼 나게 팔자
        </p>
        <p className="text-sm md:text-base text-gray-500 text-center max-w-2xl mb-8">
          한국어 프롬프트를 사고파는 커뮤니티 마켓플레이스.
          가입하면 바로 100 포인트 지급! 현금 없이 포인트로만 거래하세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            asChild
            className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
          >
            <Link href="/auth/signup">
              지금 시작하기 🚀
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/prompts">
              프롬프트 둘러보기
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-violet-600" />
              </div>
              <CardTitle>100% 포인트 거래</CardTitle>
              <CardDescription>
                가입 시 100 포인트 지급! 현금 없이 포인트로만 프롬프트를 사고팔 수 있어요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle>등급 시스템</CardTitle>
              <CardDescription>
                거래할수록 등급이 올라가요! 브론즈부터 플래티넘까지, 나만의 뱃지를 획득하세요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-violet-600" />
              </div>
              <CardTitle>안전한 커뮤니티</CardTitle>
              <CardDescription>
                포인트 시스템으로 안전하게! PG사 연동 없이 간편하게 거래할 수 있어요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 text-center">
        <div className="bg-gradient-to-r from-violet-50 to-cyan-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            아이디어를 포인트로 바꿔보세요
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            당신의 창의적인 프롬프트를 판매하거나, 필요한 프롬프트를 구매하세요.
            지금 가입하면 100 포인트를 무료로 드립니다!
          </p>
          <Button 
            size="lg" 
            asChild
            className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white hover:opacity-90"
          >
            <Link href="/auth/signup">
              무료로 시작하기
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
