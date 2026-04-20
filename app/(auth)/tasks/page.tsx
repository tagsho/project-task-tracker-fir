import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/types'
import { format, isPast, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import clsx from 'clsx'

type Filter = 'active' | 'overdue' | 'completed' | 'all'

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return format(new Date(value), 'M/d（E）', { locale: ja })
}

function isOverdue(task: any) {
  return !!task.end_date && isPast(new Date(task.end_date)) && !isToday(new Date(task.end_date)) && task.status !== 'completed'
}

function getProject(task: any) {
  const phase = relationOne<any>(task.phase)
  return relationOne<any>(phase?.project)
}

function getPhase(task: any) {
  return relationOne<any>(task.phase)
}

export default async function TasksPage({ searchParams }: { searchParams: { filter?: Filter } }) {
  const supabase = createServerSupabaseClient()
  const filter = searchParams.filter ?? 'active'

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('tasks')
    .select(`
      id,
      name,
      status,
      priority,
      progress,
      start_date,
      end_date,
      assignee_id,
      deleted_at,
      assignee:users(name),
      phase:phases(
        id,
        name,
        deleted_at,
        project:projects(id, name, deleted_at)
      )
    `)
    .is('deleted_at', null)
    .order('end_date', { ascending: true })
    .limit(100)

  if (!isAdmin) query = query.eq('assignee_id', user!.id)

  const { data } = await query

  const tasks = (data ?? []).filter((task: any) => {
    const phase = getPhase(task)
    const project = getProject(task)
    return !phase?.deleted_at && !project?.deleted_at
  })

  const visibleTasks = tasks.filter((task: any) => {
    if (filter === 'completed') return task.status === 'completed'
    if (filter === 'overdue') return isOverdue(task)
    if (filter === 'all') return true
    return task.status !== 'completed'
  })

  const activeCount = tasks.filter((task: any) => task.status !== 'completed').length
  const overdueCount = tasks.filter(isOverdue).length
  const dueTodayCount = tasks.filter((task: any) => task.end_date && isToday(new Date(task.end_date)) && task.status !== 'completed').length
  const completedCount = tasks.filter((task: any) => task.status === 'completed').length

  const filters: { href: string; label: string; value: Filter }[] = [
    { href: '/tasks', label: '未完了', value: 'active' },
    { href: '/tasks?filter=overdue', label: '遅延', value: 'overdue' },
    { href: '/tasks?filter=completed', label: '完了', value: 'completed' },
    { href: '/tasks?filter=all', label: 'すべて', value: 'all' },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold">{isAdmin ? 'タスク一覧' : 'マイタスク'}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {isAdmin ? '全ユーザーのタスクを期限順に表示します' : '自分に割り当てられたタスクを期限順に表示します'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">未完了</p>
          <p className="text-2xl font-semibold text-blue-600">{activeCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">本日期限</p>
          <p className="text-2xl font-semibold text-yellow-600">{dueTodayCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">遅延</p>
          <p className="text-2xl font-semibold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">完了</p>
          <p className="text-2xl font-semibold text-green-600">{completedCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {filters.map(item => (
          <Link
            key={item.value}
            href={item.href}
            className={clsx(
              'btn text-xs',
              filter === item.value && 'bg-indigo-50 text-indigo-700 border-indigo-200'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="text-left font-medium px-4 py-3">タスク</th>
              <th className="text-left font-medium px-4 py-3">案件 / 工程</th>
              {isAdmin && <th className="text-left font-medium px-4 py-3">担当者</th>}
              <th className="text-left font-medium px-4 py-3">期限</th>
              <th className="text-left font-medium px-4 py-3">状態</th>
              <th className="text-right font-medium px-4 py-3">進捗</th>
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((task: any) => {
              const phase = getPhase(task)
              const project = getProject(task)
              const assignee = relationOne<any>(task.assignee)
              const taskStatus = task.status as keyof typeof STATUS_COLOR
              const priority = task.priority as keyof typeof PRIORITY_COLOR
              const overdue = isOverdue(task)

              return (
                <tr key={task.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{task.name}</div>
                    <span className={clsx('badge mt-1', PRIORITY_COLOR[priority])}>
                      優先度 {PRIORITY_LABEL[priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <Link href={`/projects/${project?.id}`} className="font-medium text-gray-800 hover:text-indigo-600">
                      {project?.name ?? '—'}
                    </Link>
                    <p className="text-gray-400 mt-1">{phase?.name ?? '—'}</p>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-gray-600">{assignee?.name ?? '未設定'}</td>
                  )}
                  <td className={clsx('px-4 py-3', overdue ? 'text-red-600 font-medium' : 'text-gray-600')}>
                    {formatDate(task.end_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', overdue ? 'bg-red-100 text-red-700' : STATUS_COLOR[taskStatus])}>
                      {overdue ? '遅延' : STATUS_LABEL[taskStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{task.progress}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!visibleTasks.length && (
          <p className="px-4 py-6 text-xs text-gray-400">表示するタスクはありません</p>
        )}
      </div>
    </div>
  )
}
