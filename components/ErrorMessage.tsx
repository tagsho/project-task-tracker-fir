'use client'

import Link from 'next/link'

type ErrorMessageProps = {
  title: string
  message: string
  digest?: string
  onRetry?: () => void
  homeHref?: string
  homeLabel?: string
}

export default function ErrorMessage({
  title,
  message,
  digest,
  onRetry,
  homeHref = '/dashboard',
  homeLabel = 'ダッシュボードへ戻る',
}: ErrorMessageProps) {
  return (
    <div className="min-h-[420px] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium text-red-600 mb-2">エラーが発生しました</p>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-600 leading-6 mb-4">{message}</p>

        {digest && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 mb-4">
            <p className="text-xs text-gray-500">Digest</p>
            <p className="text-xs font-mono text-gray-800 break-all">{digest}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-primary">
              もう一度読み込む
            </button>
          )}
          <Link href={homeHref} className="btn">
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
