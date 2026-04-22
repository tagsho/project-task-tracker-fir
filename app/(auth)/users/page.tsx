import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserTable from '@/components/UserTable'
import CreateUserForm from '@/components/CreateUserForm'
import { createUser, updateUserActive, updateUserRole } from './actions'

function getNotice(searchParams?: { created?: string; error?: string }) {
  if (searchParams?.created === '1') {
    return {
      tone: 'green' as const,
      message: 'ユーザーを追加しました。',
    }
  }

  if (!searchParams?.error) return null

  const decodedError = decodeURIComponent(searchParams.error)
  const messageMap: Record<string, string> = {
    required: '名前・メールアドレス・初期パスワードを入力してください。',
    'invalid-role': '権限が不正です。',
    'service-role-missing': 'SUPABASE_SERVICE_ROLE_KEY が未設定のため、ユーザー追加を実行できません。',
    'email-already-exists': '同じメールアドレスのユーザーが既に存在します。',
    'auth-create-failed': '認証ユーザーの作成に失敗しました。',
    'profile-create-failed': 'ユーザープロフィールの保存に失敗しました。',
    'self-protected': '自分自身の権限や有効状態はこの画面から変更できません。',
    'user-update-failed': 'ユーザー情報の更新に失敗しました。',
  }

  return {
    tone: 'red' as const,
    message: messageMap[decodedError] ?? '処理に失敗しました。時間をおいて再度お試しください。',
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: { created?: string; error?: string }
}) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at')

  const notice = getNotice(searchParams)
  const canCreateUsers = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold">ユーザー管理</h1>
      </div>

      {notice && (
        <div
          className={notice.tone === 'green'
            ? 'mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700'
            : 'mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'}
        >
          {notice.message}
        </div>
      )}

      <CreateUserForm action={createUser} enabled={canCreateUsers} />
      <UserTable
        users={users ?? []}
        currentUserId={user!.id}
        updateUserRoleAction={updateUserRole}
        updateUserActiveAction={updateUserActive}
      />
    </div>
  )
}
