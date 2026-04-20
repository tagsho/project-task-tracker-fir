import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '@/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import clsx from 'clsx'

const taskSelect = 'id, name, status, priority, end_date, assignee:users(name), phase:phases(name, project:projects(id, name))'

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { view?: string; month?: string }
}) {
  const supabase = createServerSupabaseClient()
  const view = searchParams.view ?? 'list'

  const baseDate = searchParams.month ? new Date(searchParams.month + '-01') : new Date()
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)
  const today = new Date().toISOString().split('T')[0]

  let tasks: any[] = []

  if (view === 'calendar') {
    const { data } = await supabase
      .from('tasks')
      .select(taskSelect)
      .is('deleted_at', null)
      .not('end_date', 'is', null)
      .gte('end_date', format(monthStart, 'yyyy-MM-dd'))
      .lte('end_date', format(monthEnd, 'yyyy-MM-dd'))
      .order('end_date')
      .limit(200)

    tasks = data ?? []
  } else {
    const [{ data: overdueData }, { data: currentData }] = await Promise.all([
      supabase
        .from('tasks')
        .select(taskSelect)
        .is('deleted_at', null)
        .not('end_date', 'is', null)
        .neq('status', 'completed')
        .lt('end_date', today)
        .order('end_date')
        .limit(40),
      supabase
        .from('tasks')
        .select(taskSelect)
        .is('deleted_at', null)
        .not('end_date', 'is', null)
        .gte('end_date', today)
        .order('end_date')
        .limit(80),
    ])

    tasks = [...(overdueData ?? []), ...(currentData ?? [])]
  }

  const prevMonth = format(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1), 'yyyy-MM')
  const nextMonth = format(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1), 'yyyy-MM')
  const currentMonth = format(baseDate, 'yyyy-MM')

  const tasksByDate: Record<string, typeof tasks> = {}
  tasks?.forEach(task => {
    if (!task.end_date) return
    if (!tasksByDate[task.end_date]) tasksByDate[task.end_date] = []
    tasksByDate[task.end_date]!.push(task)
  })

  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const overdueTasks = tasks?.filter(t => t.end_date! < today && t.status !== 'completed') ?? []
  const todayTasks = tasks?.filter(t => t.end_date === today) ?? []
  const upcomingTasks = tasks?.filter(t => t.end_date! > today) ?? []

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-base font-semibold">スケジュール</h1>
        <div className="flex border border-gray-200 rounded-md overflow-hidden text-xs">
          <Link
            href={`/schedule?view=list&month=${currentMonth}`}
            className={clsx('px-3 py-1.5 transition-colors', view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >一覧</Link>
          <Link
            href={`/schedule?view=calendar&month=${currentMonth}`}
            className={clsx('px-3 py-1.5 border-l border-gray-200 transition-colors', view === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
          >カレンダー</Link>
        </div>
        {view === 'calendar' && (
          <div className="flex items-center gap-2 ml-auto text-xs">
            <Link href={`/schedule?view=calendar&month=${prevMonth}`} className="btn">‹</Link>
            <span className="font-medium text-gray-700">{format(baseDate, 'yyyy年M月', { locale: ja })}</span>
            <Link href={`/schedule?view=calendar&month=${nextMonth}`} className="btn">›</Link>
          </div>
        )}
      </div>

      {view === 'list' && (
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-red-600 mb-2">遅延（{overdueTasks.length}件）</h2>
              <div className="card p-0 overflow-hidden">
                {overdueTasks.map(task => <TaskRow key={task.id} task={task} overdue />)}
              </div>
            </section>
          )}
          {todayTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-yellow-600 mb-2">本日期限（{todayTasks.length}件）</h2>
              <div className="card p-0 overflow-hidden">
                {todayTasks.map(task => <TaskRow key={task.id} task={task} />)}
              </div>
            </section>
          )}
          <section>
            <h2 className="text-xs font-medium text-gray-500 mb-2">今後（{upcomingTasks.length}件）</h2>
            <div className="card p-0 overflow-hidden">
              {upcomingTasks.length === 0
                ? <p className="px-4 py-8 text-xs text-gray-400 text-center">タスクがありません</p>
                : upcomingTasks.map(task => <TaskRow key={task.id} task={task} />)
              }
            </div>
          </section>
        </div>
      )}

      {view === 'calendar' && (
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['日','月','火','水','木','金','土'].map((d, i) => (
              <div key={d} className={clsx('text-center py-2 text-xs font-medium', i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500')}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-20 border-b border-r border-gray-100 bg-gray-50" />
            ))}
            {calendarDays.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const dayTasks = tasksByDate[key] ?? []
              const dow = day.getDay()
              return (
                <div key={key} className={clsx('min-h-20 border-b border-r border-gray-100 p-1', isToday(day) && 'bg-indigo-50')}>
                  <div className={clsx('text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                    isToday(day) ? 'bg-indigo-600 text-white' : dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-600'
                  )}>{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(task => {
                      const overdue = task.end_date! < today && task.status !== 'completed'
                      return (
                        <Link key={task.id} href={`/projects/${(task.phase as any)?.project?.id}`}
                          className={clsx('block text-[10px] px-1 py-0.5 rounded truncate',
                            overdue ? 'bg-red-100 text-red-700' : task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                          )}>
                          {task.name}
                        </Link>
                      )
                    })}
                    {dayTasks.length > 3 && <p className="text-[10px] text-gray-400 px-1">+{dayTasks.length - 3}件</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, overdue = false }: { task: any; overdue?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 text-xs">
      <div className="w-24 text-gray-400 shrink-0">{task.end_date}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{task.name}</p>
        <p className="text-gray-400 truncate">{(task.phase as any)?.project?.name} › {(task.phase as any)?.name}</p>
      </div>
      {task.assignee && (
        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-medium flex items-center justify-center shrink-0">
          {task.assignee.name.charAt(0)}
        </div>
      )}
      <span className={clsx('badge shrink-0', overdue ? 'bg-red-100 text-red-700' : STATUS_COLOR[task.status as keyof typeof STATUS_COLOR])}>
        {overdue ? '遅延' : STATUS_LABEL[task.status as keyof typeof STATUS_LABEL]}
      </span>
      <span className={clsx('badge shrink-0', PRIORITY_COLOR[task.priority as keyof typeof PRIORITY_COLOR])}>
        {PRIORITY_LABEL[task.priority as keyof typeof PRIORITY_LABEL]}
      </span>
    </div>
  )
}
