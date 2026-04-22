import type { UserAdminAuditLog } from '@/types'
import clsx from 'clsx'

function actionLabel(log: UserAdminAuditLog) {
  if (log.action === 'user_created') return 'ユーザー追加'
  if (log.action === 'role_changed') return '権限変更'
  if (log.action === 'active_changed') return '有効状態変更'
  return log.action
}

function actionTone(log: UserAdminAuditLog) {
  if (log.action === 'user_created') return 'bg-green-100 text-green-700'
  if (log.action === 'role_changed') return 'bg-indigo-100 text-indigo-700'
  if (log.action === 'active_changed') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

function detailLabel(log: UserAdminAuditLog) {
  if (log.action === 'role_changed') {
    return `${log.old_role === 'admin' ? '管理者' : '一般'} → ${log.new_role === 'admin' ? '管理者' : '一般'}`
  }

  if (log.action === 'active_changed') {
    return `${log.old_is_active ? '有効' : '無効'} → ${log.new_is_active ? '有効' : '無効'}`
  }

  return '初期登録'
}

export default function UserAuditLogTable({ logs }: { logs: UserAdminAuditLog[] }) {
  if (!logs.length) {
    return (
      <div className="card mt-6 px-4 py-6 text-xs text-gray-400">
        監査ログはまだありません。
      </div>
    )
  }

  return (
    <div className="card mt-6 p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">ユーザー管理監査ログ</h2>
        <p className="text-[11px] text-gray-400">直近30件</p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">日時</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">実行者</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">対象ユーザー</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">操作</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">変更内容</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('ja-JP')}</td>
              <td className="px-4 py-3 text-gray-700">{log.actor_user?.name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{log.target_user?.name ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={clsx('badge', actionTone(log))}>{actionLabel(log)}</span>
              </td>
              <td className="px-4 py-3 text-gray-500">{detailLabel(log)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
