import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserTable from '@/components/UserTable'
import CreateUserForm from '@/components/CreateUserForm'
import UserAuditLogTable from '@/components/UserAuditLogTable'
import type { UserAdminAuditLog } from '@/types'
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

  const [{ data: users }, { data: rawAuditLogs }] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .order('created_at'),
    supabase
      .from('user_admin_audit_logs')
      .select('id, actor_user_id, target_user_id, action, old_role, new_role, old_is_active, new_is_active, created_at, actor_user:users!user_admin_audit_logs_actor_user_id_fkey(id, name), target_user:users!user_admin_audit_logs_target_user_id_fkey(id, name)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const auditLogs: UserAdminAuditLog[] = (rawAuditLogs ?? []).map((log: any) => ({
    ...log,
    actor_user: Array.isArray(log.actor_user) ? log.actor_user[0] ?? undefined : log.actor_user,
    target_user: Array.isArray(log.target_user) ? log.target_user[0] ?? undefined : log.target_user,
  }))

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
      <UserAuditLogTable logs={auditLogs} />
    </div>
  )
}
