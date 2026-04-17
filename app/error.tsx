'use client'

import { useEffect } from 'react'
import ErrorMessage from '@/components/ErrorMessage'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[app-error-boundary]', {
      route: window.location.pathname,
      digest: error.digest,
      name: error.name,
      message: error.message,
    })
  }, [error])

  return (
    <ErrorMessage
      title="画面の表示に失敗しました"
      message="一時的な問題の可能性があります。再読み込みしても直らない場合は、表示されているDigestを手がかりにサーバーログを確認できます。"
      digest={error.digest}
      onRetry={reset}
    />
  )
}
