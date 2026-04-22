import type { User } from '@/types'
import clsx from 'clsx'

type UpdateUserAction = (userId: string, formData: FormData) => void | Promise<void>

export default function UserTable({
  users,
  currentUserId,
  updateUserRoleAction,
  updateUserActiveAction,
}: {
  users: User[]
  currentUserId: string
  updateUserRoleAction: UpdateUserAction
  updateUserActiveAction: UpdateUserAction
}) {
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">名前</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">メール</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">権限</th>
            <th className="text-left px-4 py-2.5 font-medium text-gray-500">状態</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
            const isCurrentUser = user.id === currentUserId
            const roleAction = updateUserRoleAction.bind(
              null,
              user.id,
            )
            const activeAction = updateUserActiveAction.bind(
              null,
              user.id,
            )
            const nextRole = user.role === 'admin' ? 'member' : 'admin'
            const nextActive = user.is_active ? 'false' : 'true'

            return (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {user.name}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-[10px] text-indigo-500">（自分）</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{user.login_id}</td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'badge',
                      user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {user.role === 'admin' ? '管理者' : '一般'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'badge',
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {user.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!isCurrentUser && (
                    <div className="flex gap-2 justify-end">
                      <form action={roleAction}>
                        <input type="hidden" name="role" value={nextRole} />
                        <button type="submit" className="text-indigo-600 hover:underline">
                          {user.role === 'admin' ? '一般に変更' : '管理者に変更'}
                        </button>
                      </form>
                      <form action={activeAction}>
                        <input type="hidden" name="is_active" value={nextActive} />
                        <button type="submit" className="text-gray-400 hover:underline">
                          {user.is_active ? '無効化' : '有効化'}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
