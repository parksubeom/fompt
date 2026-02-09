/**
 * Global Footer Component
 * 푸터 영역 (추후 확장 가능)
 */

import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 로고 및 설명 */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent mb-2">
              FOMPT
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              네 아이디어, 폼 나게 팔자
            </p>
            <p className="text-xs text-gray-500">
              한국어 프롬프트 마켓플레이스 © {currentYear}
            </p>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-900">
              서비스
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/prompts"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  프롬프트 둘러보기
                </Link>
              </li>
              <li>
                <Link
                  href="/prompts/create"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  프롬프트 판매하기
                </Link>
              </li>
              <li>
                <Link
                  href="/purchases"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  구매 내역
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객 지원 */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-900">
              고객 지원
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  도움말
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t mt-8 pt-6">
          <p className="text-xs text-center text-gray-500">
            100% 포인트 기반 거래 시스템 · 현금 거래 없음 · 안전한 커뮤니티
          </p>
        </div>
      </div>
    </footer>
  )
}
