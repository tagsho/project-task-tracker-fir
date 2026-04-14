'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@/types'
import clsx from 'clsx'

export default function UserTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleActive(user: User) {
    if (user.id === currentUserId) return
    setLoading(user.id)
    await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id)
    setLoading(null)
    router.refresh()
  }

  async function toggleRole(user: User) {
    if (user.id === currentUserId) return
    const newRole = user.role === 'admin' ? 'member' : 'admin'
    setLoading(user.id)
    await supabase.from('users').update({ role: newRole }).eq('id', user.id)
    setLoading(null)
    router.refresh()
  }

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
          {users.map(user => (
            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {user.name}
                {user.id === currentUserId && (
                  <span className="ml-1.5 text-[10px] text-indigo-500">（自分）</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500">{user.login_id}</td>
              <td className="px-4 py-3">
                <span className={clsx(
                  'badge',
                  user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {user.role === 'admin' ? '管理者' : '一般'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={clsx(
                  'badge',
                  user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                )}>
                  {user.is_active ? '有効' : '無効'}
                </span>
              </td>
              <td className="px-4 py-3">
                {user.id !== currentUserId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRole(user)}
                      disabled={loading === user.id}
                      className="text-indigo-600 hover:underline disabled:opacity-40"
                    >
                      {user.role === 'admin' ? '一般に変更' : '管理者に変更'}
                    </button>
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={loading === user.id}
                      className="text-gray-400 hover:underline disabled:opacity-40"
                    >
                      {user.is_active ? '無効化' : '有効化'}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
