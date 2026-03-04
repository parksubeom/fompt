import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '프롬프트 마켓',
  description: 'AI 프롬프트를 둘러보고 구매하세요. 글쓰기, 코딩, 디자인, 마케팅 등 다양한 카테고리의 프롬프트가 준비되어 있습니다.',
  openGraph: {
    title: '프롬프트 마켓 | FOMPT',
    description: 'AI 프롬프트를 둘러보고 구매하세요. 다양한 카테고리의 프롬프트가 준비되어 있습니다.',
  },
}

export default function PromptsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
