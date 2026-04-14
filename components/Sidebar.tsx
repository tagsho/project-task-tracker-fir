'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard',  label: 'ダッシュボード' },
  { href: '/projects',   label: '案件一覧' },
  { href: '/schedule',   label: 'スケジュール' },
  { href: '/gantt',      label: 'ガントチャート' },
]

export default function Sidebar({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-900 leading-tight">工程表・スケジュール</p>
        <p className="text-xs text-gray-400 mt-0.5">管理ツール</p>
      </div>

      <nav className="flex-1 py-2">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center px-4 py-2 text-sm border-l-2 transition-colors',
              pathname.startsWith(href)
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            )}
          >
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/users"
            className={clsx(
              'flex items-center px-4 py-2 text-sm border-l-2 transition-colors',
              pathname.startsWith('/users')
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            )}
          >
            ユーザー管理
          </Link>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate mb-2">{userName}</p>
        <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
          ログアウト
        </button>
      </div>
    </aside>
  )
}
