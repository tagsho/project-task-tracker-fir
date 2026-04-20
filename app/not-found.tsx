import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-2">404</p>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">ページが見つかりません</h1>
        <p className="text-sm text-gray-600 leading-6 mb-4">
          URLが変わったか、まだ用意されていない画面の可能性があります。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="btn-primary">
            ダッシュボードへ戻る
          </Link>
          <Link href="/projects" className="btn">
            案件一覧を見る
          </Link>
        </div>
      </div>
    </div>
  )
}
