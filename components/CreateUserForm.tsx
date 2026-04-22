import type { Role } from '@/types'

type CreateUserAction = (formData: FormData) => void | Promise<void>

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'member', label: '一般' },
  { value: 'admin', label: '管理者' },
]

export default function CreateUserForm({
  action,
  enabled,
}: {
  action: CreateUserAction
  enabled: boolean
}) {
  return (
    <div className="card mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">ユーザー追加</h2>
        <p className="text-xs text-gray-500 mt-1">
          ログイン用メールアドレスと初期パスワードを登録します。
        </p>
      </div>

      {!enabled && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          `SUPABASE_SERVICE_ROLE_KEY` が未設定のため、この環境ではユーザー追加を実行できません。
        </p>
      )}

      <form action={action} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="user-name">名前 *</label>
            <input id="user-name" name="name" className="input" required disabled={!enabled} />
          </div>
          <div>
            <label className="label" htmlFor="user-role">権限</label>
            <select id="user-role" name="role" className="input" defaultValue="member" disabled={!enabled}>
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="user-email">メールアドレス *</label>
            <input id="user-email" name="email" type="email" className="input" required disabled={!enabled} />
          </div>
          <div>
            <label className="label" htmlFor="user-password">初期パスワード *</label>
            <input id="user-password" name="password" type="password" className="input" minLength={8} required disabled={!enabled} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-gray-400">
            追加後はこのメールアドレスでログインできます。
          </p>
          <button type="submit" className="btn-primary text-xs" disabled={!enabled}>
            ユーザーを追加
          </button>
        </div>
      </form>
    </div>
  )
}
