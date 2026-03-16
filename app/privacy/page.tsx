import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: '개인정보처리방침',
  description: 'FOMPT 개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        개인정보처리방침
      </h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <p className="text-gray-500">
          FOMPT(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요시하며, 개인정보 보호법 등 관련 법령을 준수합니다.
          시행일자: 2026년 1월 1일
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-2">
            1. 수집하는 개인정보 항목
          </h2>
          <p>
            서비스는 회원가입, 로그인, 거래 처리 등을 위해 아래와 같은 개인정보를 수집할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>필수: 이메일 주소, 비밀번호, 닉네임</li>
            <li>선택: 프로필 이미지 URL</li>
            <li>OAuth 로그인 시: 해당 제공처에서 동의한 정보(이메일, 프로필 이미지 등)</li>
            <li>자동 수집: 접속 로그, 쿠키, 서비스 이용 기록</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-2">
            2. 개인정보의 수집 및 이용 목적
          </h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>회원 식별 및 서비스 제공</li>
            <li>포인트 거래, 구매·판매 내역 관리</li>
            <li>고객 문의 및 분쟁 처리</li>
            <li>서비스 개선 및 안전한 이용 환경 조성</li>
            <li>법령에 따른 보존·제출</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-2">
            3. 개인정보의 보유 및 이용 기간
          </h2>
          <p>
            회원 탈퇴 시 또는 수집·이용 목적 달성 시까지 보유하며, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-2">
            4. 개인정보의 제3자 제공
          </h2>
          <p>
            서비스는 원칙적으로 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 법령에 따른 경우 등 예외가 있는 경우 해당 법령에 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-2">
            5. 이용자의 권리
          </h2>
          <p>
            이용자는 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수 있으며, 서비스는 법령이 정하는 범위 내에서 이를 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-2">
            6. 문의
          </h2>
          <p>
            개인정보 처리에 관한 문의는 서비스 내 고객 지원 또는 공지된 연락처로 요청하실 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  )
}
