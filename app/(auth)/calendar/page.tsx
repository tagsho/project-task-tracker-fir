import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATUS_COLOR, STATUS_LABEL } from '@/types'
import { addMonths, eachDayOfInterval, endOfMonth, format, isToday, startOfMonth, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import clsx from 'clsx'
import Link from 'next/link'

type SearchParams = {
  month?: string
  project_id?: string
}

type CalendarTask = {
  id: number
  name: string
  status: keyof typeof STATUS_COLOR
  end_date: string | null
  projectId: number | null
  projectName: string
  phaseName: string
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function parseBaseDate(month?: string) {
  if (!month) return new Date()
  const parsed = new Date(`${month}-01T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServerSupabaseClient()
  const baseDate = parseBaseDate(searchParams.month)
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  const selectedProjectId = searchParams.project_id ?? projects?.[0]?.id?.toString() ?? ''

  let query = supabase
    .from('tasks')
    .select(`
      id,
      name,
      status,
      end_date,
      deleted_at,
      phase:phases(
        id,
        name,
        project:projects(id, name, deleted_at)
      )
    `)
    .is('deleted_at', null)
    .not('end_date', 'is', null)
    .gte('end_date', format(monthStart, 'yyyy-MM-dd'))
    .lte('end_date', format(monthEnd, 'yyyy-MM-dd'))
    .order('end_date')
    .limit(200)

  if (selectedProjectId) {
    query = query.eq('phases.project_id', selectedProjectId)
  }

  const { data } = await query

  const tasks: CalendarTask[] = (data ?? [])
    .map((task: any) => {
      const phase = relationOne<any>(task.phase)
      const project = relationOne<any>(phase?.project)

      if (!phase || !project || project.deleted_at) return null

      return {
        id: task.id,
        name: task.name,
        status: task.status,
        end_date: task.end_date,
        projectId: project.id ?? null,
        projectName: project.name ?? '案件未設定',
        phaseName: phase.name ?? '工程未設定',
      }
    })
    .filter((task): task is CalendarTask => !!task)

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const tasksByDate = tasks.reduce<Record<string, CalendarTask[]>>((map, task) => {
    if (!task.end_date) return map
    if (!map[task.end_date]) map[task.end_date] = []
    map[task.end_date].push(task)
    return map
  }, {})

  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const overdueCount = tasks.filter(task => !!task.end_date && task.end_date < todayKey && task.status !== 'completed').length
  const todayCount = tasks.filter(task => task.end_date === todayKey).length
  const completedCount = tasks.filter(task => task.status === 'completed').length

  const prevMonth = format(subMonths(baseDate, 1), 'yyyy-MM')
  const nextMonth = format(addMonths(baseDate, 1), 'yyyy-MM')

  function href(overrides: Partial<SearchParams>) {
    const params = new URLSearchParams()
    const next = {
      month: format(baseDate, 'yyyy-MM'),
      project_id: selectedProjectId,
      ...overrides,
    }

    Object.entries(next).forEach(([key, value]) => {
      if (!value) return
      params.set(key, value)
    })

    if ((overrides.month ?? format(baseDate, 'yyyy-MM')) === format(new Date(), 'yyyy-MM')) {
      params.delete('month')
    }

    return `/calendar${params.toString() ? `?${params.toString()}` : ''}`
  }

  return (
    <div className="px-6 py-5">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">カレンダー</h1>
          <p className="mt-1 text-sm text-gray-400">期限ベースでタスクを月間表示します</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/schedule" className="btn text-xs">
            工程表へ
          </Link>
          <Link href="/tasks" className="btn text-xs">
            タスク一覧へ
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs text-gray-500">今月のタスク</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{tasks.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs text-gray-500">本日期限</p>
          <p className={clsx('mt-1 text-2xl font-semibold', todayCount > 0 ? 'text-yellow-600' : 'text-gray-500')}>{todayCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs text-gray-500">遅延 / 完了</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            <span className={overdueCount > 0 ? 'text-red-600' : 'text-gray-500'}>{overdueCount}</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className={completedCount > 0 ? 'text-emerald-600' : 'text-gray-500'}>{completedCount}</span>
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <form action="/calendar" className="flex flex-wrap items-center gap-2">
            <select name="project_id" defaultValue={selectedProjectId} className="input w-[240px] text-xs">
              {projects?.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <input type="hidden" name="month" value={format(baseDate, 'yyyy-MM')} />
            <button type="submit" className="btn text-xs">
              表示
            </button>
          </form>
          <div className="flex items-center gap-2 text-xs">
            <Link href={href({ month: prevMonth })} className="btn px-2.5 text-xs">
              ‹
            </Link>
            <div className="btn cursor-default text-xs">{format(baseDate, 'yyyy年M月', { locale: ja })}</div>
            <Link href={href({ month: nextMonth })} className="btn px-2.5 text-xs">
              ›
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200 bg-[#fbfcff]">
          {['日', '月', '火', '水', '木', '金', '土'].map((label, index) => (
            <div
              key={label}
              className={clsx(
                'px-3 py-2 text-center text-xs font-medium',
                index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-500'
              )}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`blank-${index}`} className="min-h-[130px] border-b border-r border-gray-100 bg-gray-50" />
          ))}

          {calendarDays.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const entries = tasksByDate[key] ?? []
            const dayOfWeek = day.getDay()

            return (
              <div key={key} className={clsx('min-h-[130px] border-b border-r border-gray-100 p-2', isToday(day) && 'bg-[#f8fbff]')}>
                <div
                  className={clsx(
                    'mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                    isToday(day)
                      ? 'bg-[#2563eb] text-white'
                      : dayOfWeek === 0
                        ? 'text-red-400'
                        : dayOfWeek === 6
                          ? 'text-blue-400'
                          : 'text-gray-700'
                  )}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {entries.slice(0, 3).map(task => (
                    <Link
                      key={task.id}
                      href={task.projectId ? `/projects/${task.projectId}` : '/projects'}
                      className={clsx(
                        'block rounded px-2 py-1 text-[11px] transition-colors',
                        STATUS_COLOR[task.status]
                      )}
                    >
                      <p className="truncate font-medium">{task.name}</p>
                      <p className="truncate opacity-80">{task.phaseName}</p>
                    </Link>
                  ))}
                  {entries.length > 3 && <p className="px-1 text-[11px] text-gray-400">+{entries.length - 3}件</p>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">今月の期限一覧</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {tasks.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">この月に表示できるタスクはありません</div>
          ) : (
            tasks.slice(0, 12).map(task => (
              <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{task.name}</p>
                  <p className="text-xs text-gray-400">{task.projectName} / {task.phaseName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{task.end_date}</span>
                  <span className={clsx('badge', STATUS_COLOR[task.status])}>{STATUS_LABEL[task.status]}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
