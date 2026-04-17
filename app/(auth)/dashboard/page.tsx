import { createServerSupabaseClient } from '@/lib/supabase-server'
import { format, isToday, isPast } from 'date-fns'
import { ja } from 'date-fns/locale'
import clsx from 'clsx'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: inProgressCount },
    { data: urgentTasks },
    { data: projects },
    { data: users },
    { data: userTasks },
  ] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress').is('deleted_at', null),

    supabase.from('tasks')
      .select('id, name, end_date, assignee:users(name)')
      .is('deleted_at', null)
      .neq('status', 'completed')
      .lte('end_date', today)
      .order('end_date')
      .limit(10),

    supabase.from('projects')
      .select('id, name, phases(tasks(status))')
      .eq('status', 'in_progress')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(8),

    supabase.from('users')
      .select('id, name')
      .eq('is_active', true),

    supabase.from('tasks')
      .select('assignee_id, status, end_date')
      .is('deleted_at', null)
      .not('assignee_id', 'is', null),
  ])

  const dueTodayCount = urgentTasks?.filter(t => isToday(new Date(t.end_date))).length ?? 0
  const overdueCount = urgentTasks?.filter(t => !isToday(new Date(t.end_date))).length ?? 0

  function autoProgress(phases: any[]): number {
    const tasks = phases?.flatMap((p: any) => p.tasks ?? []) ?? []
    if (!tasks.length) return 0
    return Math.round(tasks.filter((t: any) => t.status === 'completed').length / tasks.length * 100)
  }

  function getInitial(name?: string | null): string {
    if (!name) return '?'
    return name.charAt(0)
  }

  function getAssigneeName(assignee: { name?: string | null } | { name?: string | null }[] | null): string | null {
    if (!assignee) return null
    return Array.isArray(assignee) ? assignee[0]?.name ?? null : assignee.name ?? null
  }

  function getUserTaskStats(userId: string) {
    const tasks = userTasks?.filter(task => task.assignee_id === userId) ?? []
    return {
      totalTasks: tasks.length,
      overdueTasks: tasks.filter(task =>
        task.end_date && isPast(new Date(task.end_date)) && task.status !== 'completed'
      ).length,
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold">ダッシュボード</h1>
        <p className="text-xs text-gray-400">{format(new Date(), 'yyyy年M月d日（E）', { locale: ja })}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">進行中の案件</p>
          <p className="text-2xl font-semibold text-indigo-600">{inProgressCount ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">本日期限のタスク</p>
          <p className="text-2xl font-semibold text-yellow-600">{dueTodayCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">遅延タスク</p>
          <p className="text-2xl font-semibold text-red-600">{overdueCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="text-xs font-medium text-gray-700 mb-3">遅延・本日期限タスク</h2>
          {urgentTasks?.length === 0 && (
            <p className="text-xs text-gray-400">なし</p>
          )}
          <div className="space-y-2">
            {urgentTasks?.map(task => {
              const overdue = !isToday(new Date(task.end_date))
              const assigneeName = getAssigneeName(task.assignee)

              return (
                <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                  <span className={clsx('badge', overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                    {overdue ? '遅延' : '本日'}
                  </span>
                  <span className="flex-1 text-xs text-gray-800 truncate">{task.name}</span>
                  {assigneeName && (
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-medium flex items-center justify-center shrink-0">
                      {getInitial(assigneeName)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xs font-medium text-gray-700 mb-3">案件進捗</h2>
          <div className="space-y-3">
            {projects?.map(project => {
              const progress = autoProgress(project.phases ?? [])
              return (
                <div key={project.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-800 truncate flex-1">{project.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xs font-medium text-gray-700 mb-3">担当者別タスク状況</h2>
        <div className="grid grid-cols-4 gap-3">
          {users?.map(user => {
            const { totalTasks, overdueTasks } = getUserTaskStats(user.id)
            if (totalTasks === 0) return null
            return (
              <div key={user.id} className="text-center bg-gray-50 rounded-lg p-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center mx-auto mb-1.5">
                  {getInitial(user.name)}
                </div>
                <p className="text-xs text-gray-600 mb-1 truncate">{user.name}</p>
                <p className={clsx('text-xs font-medium', overdueTasks > 0 ? 'text-red-600' : 'text-green-600')}>
                  遅延 {overdueTasks}
                </p>
                <p className="text-xs text-gray-400">担当 {totalTasks}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
