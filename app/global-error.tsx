'use client'

import { useEffect } from 'react'
import './globals.css'
import ErrorMessage from '@/components/ErrorMessage'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[global-error-boundary]', {
      route: window.location.pathname,
      digest: error.digest,
      name: error.name,
      message: error.message,
    })
  }, [error])

  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ErrorMessage
          title="アプリの読み込みに失敗しました"
          message="画面の土台部分でエラーが起きました。再読み込みしても直らない場合は、Digestを使ってVercelのログを確認できます。"
          digest={error.digest}
          onRetry={reset}
          homeHref="/login"
          homeLabel="ログインへ戻る"
        />
      </body>
    </html>
  )
}
