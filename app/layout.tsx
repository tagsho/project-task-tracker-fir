import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '工程表・スケジュール管理ツール',
  description: '案件・工程・タスクを一元管理するツール',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
