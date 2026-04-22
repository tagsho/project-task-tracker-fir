export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const error = searchParams?.error
  const message = error === 'inactive'
    ? 'このアカウントは無効化されています。管理者にお問い合わせください。'
    : error === 'invalid'
      ? 'メールアドレスまたはパスワードが正しくありません'
      : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">工程表・スケジュール管理</h1>
          <p className="text-sm text-gray-500 mt-1">社内向けシステム</p>
        </div>
        <div className="card">
          <form action="/auth/login" method="post" className="space-y-4">
            <div>
              <label className="label" htmlFor="email">メールアドレス</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="password">パスワード</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                required
              />
            </div>
            {message && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">
                {message}
              </p>
            )}
            <button type="submit" className="btn-primary w-full justify-center">
              ログイン
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
