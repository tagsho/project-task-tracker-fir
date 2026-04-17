'use client'

import { useEffect } from 'react'
import ErrorMessage from '@/components/ErrorMessage'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AuthError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[auth-error-boundary]', {
      route: window.location.pathname,
      digest: error.digest,
      name: error.name,
      message: error.message,
    })
  }, [error])

  return (
    <ErrorMessage
      title="この画面の読み込みに失敗しました"
      message="ログイン状態は維持したまま、対象画面だけを復旧できるようにしています。再読み込みしても直らない場合は、Digestと現在のURLを見れば原因を追いやすくなります。"
      digest={error.digest}
      onRetry={reset}
    />
  )
}
