'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import clsx from 'clsx'

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-current" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const MAIN_ITEMS = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: 'M3.5 10.5 10 4l6.5 6.5M5.5 9.5v6h9v-6M8 15.5v-3h4v3',
  },
  {
    href: '/schedule',
    label: '工程・スケジュール',
    icon: 'M4.5 5.5h11M6.5 3.5v4M13.5 3.5v4M4.5 8.5h11v7h-11zM7.5 11.5h2M10.5 11.5h2M7.5 14.5h2',
  },
  {
    href: '/tasks',
    label: '進捗管理',
    icon: 'M4.5 10.5 8 14l7.5-8.5M4.5 5.5h11M4.5 15.5h6',
  },
  {
    href: '/projects',
    label: '案件管理',
    icon: 'M4.5 4.5h11v11h-11zM7.5 7.5h5M7.5 10.5h5M7.5 13.5h3',
  },
]

const REPORT_ITEMS = [
  {
    href: '/gantt',
    label: 'ガントチャート',
    icon: 'M4.5 14.5V5.5M9.5 14.5v-4M14.5 14.5v-8',
  },
]

const SCHEDULE_CHILDREN = [
  { href: '/schedule', label: '工程表・スケジュール管理' },
  { href: '/milestones', label: 'マイルストーン' },
  { href: '/calendar', label: 'カレンダー' },
]

const PREFETCH_ROUTES = ['/schedule', '/tasks', '/projects', '/gantt', '/calendar', '/milestones']

function isSamePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Sidebar({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    PREFETCH_ROUTES
      .filter(route => route !== pathname)
      .forEach(route => {
        router.prefetch(route)
      })
  }, [pathname, router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isScheduleOpen = ['/schedule', '/calendar', '/milestones'].some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  )

  return (
    <aside className="w-[222px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 h-[60px] border-b border-gray-200">
        <div className="h-8 w-8 rounded-md bg-[#2563eb] text-white flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M4 14V6.5A1.5 1.5 0 0 1 5.5 5h9A1.5 1.5 0 0 1 16 6.5V14M4 14h12M7 14V9.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1V14M12 14V8.5a1 1 0 0 1 1-1h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-900">ProManage</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 text-[14px] text-gray-600">
        <div className="space-y-1">
          {MAIN_ITEMS.map(item => {
            const active = item.href === '/schedule' ? isScheduleOpen : isSamePath(pathname, item.href)

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  className={clsx(
                    'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                    active ? 'bg-[#eef3ff] text-[#2563eb] font-medium' : 'hover:bg-gray-50'
                  )}
                >
                  <Icon path={item.icon} />
                  <span>{item.label}</span>
                </Link>

                {item.href === '/schedule' && isScheduleOpen && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-gray-100 pl-3">
                    {SCHEDULE_CHILDREN.map(child => {
                      const childActive = isSamePath(pathname, child.href)

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          prefetch
                          className={clsx(
                            'block rounded-md px-3 py-2 text-[13px] transition-colors',
                            childActive ? 'bg-[#eef3ff] text-[#2563eb] font-medium' : 'hover:bg-gray-50 text-gray-500'
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 space-y-1">
          {REPORT_ITEMS.map(item => {
            const active = isSamePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                  active ? 'bg-[#eef3ff] text-[#2563eb] font-medium' : 'hover:bg-gray-50'
                )}
              >
                <Icon path={item.icon} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/users"
              prefetch
              className={clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                isSamePath(pathname, '/users') ? 'bg-[#eef3ff] text-[#2563eb] font-medium' : 'hover:bg-gray-50'
              )}
            >
              <Icon path="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 16c0-2.2 2.5-4 5.5-4s5.5 1.8 5.5 4" />
              <span>メンバー管理</span>
            </Link>
          )}
        </div>
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="rounded-lg border border-gray-200 px-3 py-3">
          <p className="text-[12px] text-gray-400 mb-1">ログイン中</p>
          <p className="text-[13px] font-medium text-gray-700 truncate">{userName}</p>
        </div>
        <button onClick={handleLogout} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
          ログアウト
        </button>
      </div>
    </aside>
  )
}
