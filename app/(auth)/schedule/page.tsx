import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/types'
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  max,
  min,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import clsx from 'clsx'

type SearchParams = {
  project_id?: string
  anchor?: string
  full?: string
  panel?: string
  filter?: string
  page?: string
}

type TimelineRow = {
  key: string
  wbs: string
  name: string
  assignee: string
  progress: number
  status: keyof typeof STATUS_COLOR
  priority?: keyof typeof PRIORITY_COLOR
  start: string | null
  end: string | null
  isPhase: boolean
}

const PROJECT_SELECT = 'id, name, status'
const DETAIL_SELECT = `
  id,
  name,
  phases(
    id,
    name,
    status,
    progress,
    sort_order,
    start_date,
    end_date,
    deleted_at,
    tasks(
      id,
      name,
      status,
      priority,
      progress,
      start_date,
      end_date,
      updated_at,
      deleted_at,
      assignee_id,
      assignee:users(name)
    )
  )
`

function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function progressTone(progress: number) {
  if (progress >= 100) return 'bg-emerald-100 text-emerald-700'
  if (progress > 0) return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-500'
}

function progressBarTone(progress: number) {
  if (progress >= 100) return 'bg-emerald-500'
  if (progress > 0) return 'bg-blue-500'
  return 'bg-gray-300'
}

function dayLabel(day: Date) {
  return format(day, 'd', { locale: ja })
}

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServerSupabaseClient()

  const { data: projects } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .is('deleted_at', null)
    .order('name')

  const selectedId = searchParams.project_id ?? projects?.[0]?.id?.toString() ?? ''
  const panel = searchParams.panel === 'calendar' ? 'calendar' : 'table'
  const filter = searchParams.filter ?? 'all'
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1)
  const anchorDate = parseDate(searchParams.anchor) ?? new Date()
  const showFull = searchParams.full === '1'

  let project: any = null
  if (selectedId) {
    const { data } = await supabase
      .from('projects')
      .select(DETAIL_SELECT)
      .eq('id', selectedId)
      .is('deleted_at', null)
      .single()

    project = data
  }

  const phases = ((project?.phases as any[]) ?? [])
    .filter(phase => !phase.deleted_at)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const datedTasks = phases.flatMap((phase, phaseIndex) =>
    ((phase.tasks as any[]) ?? [])
      .filter(task => !task.deleted_at)
      .map((task, taskIndex) => ({
        ...task,
        phaseName: phase.name,
        phaseStatus: phase.status,
        phaseProgress: phase.progress,
        phaseIndex,
        taskIndex,
        wbs: `${phaseIndex + 1}.${taskIndex + 1}`,
      }))
  )

  const startCandidates = [
    ...phases.map(phase => parseDate(phase.start_date)).filter(Boolean),
    ...datedTasks.map(task => parseDate(task.start_date)).filter(Boolean),
  ] as Date[]
  const endCandidates = [
    ...phases.map(phase => parseDate(phase.end_date)).filter(Boolean),
    ...datedTasks.map(task => parseDate(task.end_date)).filter(Boolean),
  ] as Date[]

  const fallbackStart = startOfWeek(anchorDate, { weekStartsOn: 1 })
  const fallbackEnd = endOfWeek(addWeeks(anchorDate, 10), { weekStartsOn: 1 })
  const fullStart = startCandidates.length ? startOfWeek(min(startCandidates), { weekStartsOn: 1 }) : fallbackStart
  const fullEnd = endCandidates.length ? endOfWeek(max(endCandidates), { weekStartsOn: 1 }) : fallbackEnd

  const rangeStart = showFull ? fullStart : startOfWeek(subWeeks(anchorDate, 1), { weekStartsOn: 1 })
  const rangeEnd = showFull ? fullEnd : endOfWeek(addWeeks(anchorDate, 10), { weekStartsOn: 1 })
  const totalDays = Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart) + 1)

  const phaseRows: TimelineRow[] = phases.map((phase, index) => {
    const phaseTasks = ((phase.tasks as any[]) ?? []).filter((task: any) => !task.deleted_at)
    const phaseStart = parseDate(phase.start_date) ?? (phaseTasks.length ? min(phaseTasks.map((task: any) => parseDate(task.start_date)).filter(Boolean) as Date[]) : null)
    const phaseEnd = parseDate(phase.end_date) ?? (phaseTasks.length ? max(phaseTasks.map((task: any) => parseDate(task.end_date)).filter(Boolean) as Date[]) : null)

    return {
      key: `phase-${phase.id}`,
      wbs: `${index + 1}`,
      name: phase.name,
      assignee: '開発チーム',
      progress: Number(phase.progress ?? 0),
      status: phase.status,
      start: phaseStart ? format(phaseStart, 'yyyy-MM-dd') : null,
      end: phaseEnd ? format(phaseEnd, 'yyyy-MM-dd') : null,
      isPhase: true,
    }
  })

  const timelineRows: TimelineRow[] = phases.flatMap((phase, phaseIndex) => {
    const tasks = ((phase.tasks as any[]) ?? [])
      .filter((task: any) => !task.deleted_at)
      .map((task: any, taskIndex: number) => ({
        key: `task-${task.id}`,
        wbs: `${phaseIndex + 1}.${taskIndex + 1}`,
        name: task.name,
        assignee: task.assignee?.name ?? '未設定',
        progress: Number(task.progress ?? 0),
        status: task.status,
        priority: task.priority,
        start: task.start_date,
        end: task.end_date,
        isPhase: false,
      }))

    return [phaseRows[phaseIndex], ...tasks]
  })

  const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 })
  const monthSegments = weeks.reduce<{ label: string; span: number }[]>((segments, weekStart) => {
    const label = format(weekStart, 'yyyy年M月', { locale: ja })
    const last = segments[segments.length - 1]
    if (last?.label === label) {
      last.span += 1
    } else {
      segments.push({ label, span: 1 })
    }
    return segments
  }, [])

  const taskRows = datedTasks
    .map(task => {
      const startDate = parseDate(task.start_date)
      const endDate = parseDate(task.end_date)
      const duration = startDate && endDate ? differenceInCalendarDays(endDate, startDate) + 1 : null
      const isOverdue = !!task.end_date && task.end_date < format(new Date(), 'yyyy-MM-dd') && task.status !== 'completed'

      return {
        id: task.id,
        wbs: task.wbs,
        name: task.name,
        assignee: task.assignee?.name ?? '未設定',
        start: task.start_date,
        end: task.end_date,
        duration,
        progress: Number(task.progress ?? 0),
        status: task.status,
        priority: task.priority,
        updatedAt: task.updated_at,
        isOverdue,
      }
    })
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''))

  const stats = {
    all: taskRows.length,
    in_progress: taskRows.filter(task => task.status === 'in_progress').length,
    not_started: taskRows.filter(task => task.status === 'not_started').length,
    completed: taskRows.filter(task => task.status === 'completed').length,
    overdue: taskRows.filter(task => task.isOverdue).length,
  }

  const filteredRows = taskRows.filter(task => {
    if (filter === 'all') return true
    if (filter === 'overdue') return task.isOverdue
    return task.status === filter
  })

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const calendarMonthStart = startOfMonth(anchorDate)
  const calendarMonthEnd = endOfMonth(anchorDate)
  const calendarDays = eachDayOfInterval({ start: calendarMonthStart, end: calendarMonthEnd })
  const tasksByDate = taskRows.reduce<Record<string, typeof taskRows>>((map, task) => {
    if (!task.end) return map
    if (!map[task.end]) map[task.end] = []
    map[task.end].push(task)
    return map
  }, {})

  function href(overrides: Partial<SearchParams>) {
    const params = new URLSearchParams()
    const next = {
      project_id: selectedId,
      anchor: format(anchorDate, 'yyyy-MM-dd'),
      panel,
      filter,
      page: String(currentPage),
      ...overrides,
    }

    Object.entries(next).forEach(([key, value]) => {
      if (!value) return
      params.set(key, value)
    })

    if (next.full !== '1') params.delete('full')
    if ((overrides.panel ?? panel) === 'table') params.delete('panel')
    if ((overrides.filter ?? filter) === 'all') params.delete('filter')
    if ((overrides.page ?? String(currentPage)) === '1') params.delete('page')

    return `/schedule?${params.toString()}`
  }

  const selectedProjectName = project?.name ?? '案件未選択'
  const taskAddHref = selectedId
    ? phases[0]?.id
      ? `/projects/${selectedId}/phases/${phases[0].id}/tasks/new`
      : `/projects/${selectedId}/phases/new`
    : '/projects'

  return (
    <div className="px-6 py-5">
      <div className="h-[60px] bg-white border border-gray-200 rounded-xl px-5 flex items-center justify-between shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <button className="h-9 w-9 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <form action="/schedule" className="flex items-center gap-2 text-sm text-gray-600">
            <select name="project_id" defaultValue={selectedId} className="rounded-md border border-transparent bg-transparent px-2 py-1 font-medium text-gray-800 focus:border-gray-200 focus:bg-white focus:outline-none">
              {projects?.map(projectOption => (
                <option key={projectOption.id} value={projectOption.id}>
                  {projectOption.name}
                </option>
              ))}
            </select>
            <input type="hidden" name="anchor" value={format(anchorDate, 'yyyy-MM-dd')} />
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-600">
              表示
            </button>
          </form>
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          <button className="h-9 w-9 rounded-full hover:bg-gray-50 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="m14 14-3.2-3.2m2.2-4.1a4.7 4.7 0 1 1-9.4 0 4.7 4.7 0 0 1 9.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-gray-50 flex items-center justify-center relative">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M10 4.5a3 3 0 0 0-3 3v1.2c0 .5-.2.9-.5 1.3l-.9 1.1h8.8l-.9-1.1c-.3-.4-.5-.8-.5-1.3V7.5a3 3 0 0 0-3-3ZM8.5 14a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] text-white flex items-center justify-center">3</span>
          </button>
          <div className="h-9 px-3 rounded-full border border-gray-200 bg-white flex items-center gap-2 text-sm text-gray-700">
            <span className="h-7 w-7 rounded-full bg-[#eef3ff] text-[#2563eb] flex items-center justify-center text-xs font-semibold">
              {selectedProjectName.charAt(0)}
            </span>
            <span>{selectedProjectName}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">工程表・スケジュール管理</h1>
          <p className="text-sm text-gray-400 mt-1">{selectedProjectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href({ panel: 'table', page: '1' })} className="btn-primary text-xs">
            ガントチャート
          </Link>
          <Link href={href({ panel: 'table', page: '1' }) + '#schedule-list'} className="btn text-xs">
            スケジュール表
          </Link>
          <Link href={href({ panel: 'calendar', page: '1' }) + '#schedule-list'} className="btn text-xs">
            カレンダー
          </Link>
          <button className="btn text-xs px-2.5">…</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={href({ anchor: format(new Date(), 'yyyy-MM-dd'), full: undefined })} className="btn text-xs">
            今日
          </Link>
          <Link href={href({ anchor: format(subWeeks(anchorDate, 2), 'yyyy-MM-dd'), full: undefined })} className="btn text-xs px-2.5">
            ‹
          </Link>
          <Link href={href({ anchor: format(addWeeks(anchorDate, 2), 'yyyy-MM-dd'), full: undefined })} className="btn text-xs px-2.5">
            ›
          </Link>
          <div className="btn text-xs cursor-default">
            {format(rangeStart, 'yyyy/MM/dd')} 〜 {format(rangeEnd, 'yyyy/MM/dd')}
          </div>
          <Link href={href({ full: showFull ? undefined : '1' })} className="btn text-xs">
            {showFull ? '通常表示' : '全体を表示'}
          </Link>
        </div>
        <Link href={taskAddHref} className="btn-primary text-xs">
          ＋ タスクを追加
        </Link>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="grid min-h-[420px] grid-cols-[470px_minmax(720px,1fr)]">
          <div className="border-r border-gray-200">
            <div className="grid grid-cols-[72px_minmax(0,1fr)_96px_92px] items-center border-b border-gray-200 bg-[#fbfcff] px-4 py-3 text-[12px] font-semibold text-gray-500">
              <span>WBS</span>
              <span>タスク名</span>
              <span className="text-center">担当者</span>
              <span className="text-center">進捗率</span>
            </div>
            <div>
              {timelineRows.map(row => (
                <div
                  key={row.key}
                  className={clsx(
                    'grid grid-cols-[72px_minmax(0,1fr)_96px_92px] items-center px-4 border-b border-gray-100 text-[13px] min-h-[44px]',
                    row.isPhase ? 'bg-white font-semibold text-gray-800' : 'bg-white text-gray-600'
                  )}
                >
                  <span>{row.wbs}</span>
                  <span className={clsx('truncate pr-3', row.isPhase ? 'font-semibold text-gray-900' : 'pl-5')}>{row.name}</span>
                  <span className="truncate text-center text-gray-500">{row.assignee}</span>
                  <span className="flex justify-center">
                    <span className={clsx('badge min-w-[52px] justify-center', progressTone(row.progress))}>{row.progress}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <div style={{ minWidth: `${weeks.length * 96}px` }}>
              <div className="grid border-b border-gray-200 bg-[#fbfcff]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(96px, 1fr))` }}>
                {monthSegments.map((segment, index) => (
                  <div
                    key={`${segment.label}-${index}`}
                    className="border-r border-gray-100 px-3 py-2 text-center text-[12px] font-semibold text-gray-600"
                    style={{ gridColumn: `span ${segment.span}` }}
                  >
                    {segment.label}
                  </div>
                ))}
              </div>
              <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(96px, 1fr))` }}>
                {weeks.map(weekStart => (
                  <div key={weekStart.toISOString()} className="border-r border-gray-100 px-3 py-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{dayLabel(weekStart)}</span>
                      <span>{dayLabel(addDays(weekStart, 6))}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                {timelineRows.map(row => {
                  const startDate = parseDate(row.start ?? undefined)
                  const endDate = parseDate(row.end ?? undefined)
                  const visible = startDate && endDate && endDate >= rangeStart && startDate <= rangeEnd

                  let left = 0
                  let width = 0
                  if (visible && startDate && endDate) {
                    const clippedStart = startDate < rangeStart ? rangeStart : startDate
                    const clippedEnd = endDate > rangeEnd ? rangeEnd : endDate
                    left = (differenceInCalendarDays(clippedStart, rangeStart) / totalDays) * 100
                    width = ((differenceInCalendarDays(clippedEnd, clippedStart) + 1) / totalDays) * 100
                  }

                  return (
                    <div key={row.key} className="relative border-b border-gray-100" style={{ height: 44 }}>
                      <div className="absolute inset-x-0 inset-y-0 bg-[linear-gradient(to_right,rgba(226,232,240,0.8)_1px,transparent_1px)]" style={{ backgroundSize: `96px 44px` }} />
                      {visible && (
                        <div className="absolute top-1/2 -translate-y-1/2 px-1.5" style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}>
                          <div className={clsx('relative h-4 overflow-hidden rounded-sm', row.isPhase ? 'bg-emerald-200' : row.status === 'completed' ? 'bg-emerald-200' : row.status === 'in_progress' ? 'bg-blue-200' : row.status === 'on_hold' ? 'bg-violet-200' : 'bg-gray-200')}>
                            <div
                              className={clsx('absolute inset-y-0 left-0 rounded-sm', row.isPhase ? 'bg-emerald-500' : row.status === 'completed' ? 'bg-emerald-500' : row.status === 'in_progress' ? 'bg-blue-500' : row.status === 'on_hold' ? 'bg-violet-500' : 'bg-gray-400')}
                              style={{ width: `${Math.min(100, Math.max(0, row.progress))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {isToday(new Date()) && format(new Date(), 'yyyy-MM-dd') >= format(rangeStart, 'yyyy-MM-dd') && format(new Date(), 'yyyy-MM-dd') <= format(rangeEnd, 'yyyy-MM-dd') && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400 pointer-events-none"
                    style={{ left: `${(differenceInCalendarDays(new Date(), rangeStart) / totalDays) * 100}%` }}
                  >
                    <span className="absolute -top-1 -left-[5px] h-3 w-3 rounded-full bg-red-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="schedule-list" className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[18px] font-semibold text-gray-900">スケジュール一覧</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                ['all', 'すべて', stats.all],
                ['in_progress', '進行中', stats.in_progress],
                ['not_started', '未着手', stats.not_started],
                ['completed', '完了', stats.completed],
                ['overdue', '遅延', stats.overdue],
              ].map(([value, label, count]) => (
                <Link
                  key={String(value)}
                  href={href({ filter: String(value), page: '1' }) + '#schedule-list'}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 border text-xs transition-colors',
                    filter === value ? 'border-[#2563eb] bg-[#eef3ff] text-[#2563eb] font-medium' : 'border-transparent text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <span>{label}</span>
                  <span className={clsx('rounded-full px-1.5 py-0.5', filter === value ? 'bg-white' : 'bg-gray-100 text-gray-500')}>{count}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn text-xs">フィルター</button>
            <button className="btn text-xs">表示設定</button>
            <button className="btn text-xs">エクスポート</button>
          </div>
        </div>

        {panel === 'calendar' ? (
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">{format(anchorDate, 'yyyy年M月', { locale: ja })}</h3>
              <div className="flex items-center gap-2 text-xs">
                <Link href={href({ anchor: format(subWeeks(anchorDate, 4), 'yyyy-MM-dd') }) + '#schedule-list'} className="btn text-xs px-2.5">‹</Link>
                <Link href={href({ anchor: format(addWeeks(anchorDate, 4), 'yyyy-MM-dd') }) + '#schedule-list'} className="btn text-xs px-2.5">›</Link>
              </div>
            </div>
            <div className="grid grid-cols-7 rounded-lg border border-gray-200 overflow-hidden">
              {['日', '月', '火', '水', '木', '金', '土'].map(label => (
                <div key={label} className="border-b border-r border-gray-100 bg-[#fbfcff] px-3 py-2 text-center text-xs font-medium text-gray-500 last:border-r-0">
                  {label}
                </div>
              ))}
              {Array.from({ length: calendarMonthStart.getDay() }).map((_, index) => (
                <div key={`blank-${index}`} className="min-h-[110px] border-b border-r border-gray-100 bg-gray-50" />
              ))}
              {calendarDays.map(day => {
                const key = format(day, 'yyyy-MM-dd')
                const entries = tasksByDate[key] ?? []
                return (
                  <div key={key} className={clsx('min-h-[110px] border-b border-r border-gray-100 px-2 py-2', isToday(day) && 'bg-[#f8fbff]')}>
                    <div className={clsx('mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs', isToday(day) ? 'bg-[#2563eb] text-white' : isSameMonth(day, calendarMonthStart) ? 'text-gray-700' : 'text-gray-300')}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {entries.slice(0, 3).map(task => (
                        <div key={task.id} className={clsx('rounded px-2 py-1 text-[11px] truncate', task.isOverdue ? 'bg-red-50 text-red-600' : task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700')}>
                          {task.name}
                        </div>
                      ))}
                      {entries.length > 3 && <p className="text-[11px] text-gray-400">+{entries.length - 3}件</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-[#fbfcff] text-gray-500 text-xs">
                  <tr>
                    {['#', 'WBS', 'タスク名', '担当者', '開始日', '終了日', '期間', '進捗率', 'ステータス', '優先度', '更新日'].map(label => (
                      <th key={label} className="px-4 py-3 text-left font-medium border-b border-gray-200">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, index) => (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 text-[13px]">
                      <td className="px-4 py-3 text-gray-400">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-4 py-3 text-gray-600">{row.wbs}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{row.assignee}</td>
                      <td className="px-4 py-3 text-gray-600">{row.start ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.end ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.duration ? `${row.duration}日` : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-gray-100 overflow-hidden">
                            <div className={clsx('h-full rounded-full', progressBarTone(row.progress))} style={{ width: `${row.progress}%` }} />
                          </div>
                          <span className="text-gray-600">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge', row.isOverdue ? 'bg-red-100 text-red-700' : STATUS_COLOR[row.status as keyof typeof STATUS_COLOR])}>
                          {row.isOverdue ? '遅延' : STATUS_LABEL[row.status as keyof typeof STATUS_LABEL]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge', PRIORITY_COLOR[row.priority as keyof typeof PRIORITY_COLOR])}>
                          {PRIORITY_LABEL[row.priority as keyof typeof PRIORITY_LABEL]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{format(new Date(row.updatedAt), 'yyyy/MM/dd')}</td>
                    </tr>
                  ))}
                  {pagedRows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">
                        表示できるタスクがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Link href={href({ page: String(Math.max(1, currentPage - 1)) }) + '#schedule-list'} className={clsx('btn text-xs px-2.5', currentPage === 1 && 'pointer-events-none opacity-40')}>
                  ‹
                </Link>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                  const number = index + 1
                  return (
                    <Link
                      key={number}
                      href={href({ page: String(number) }) + '#schedule-list'}
                      className={clsx('h-8 min-w-8 rounded-md border px-3 text-xs inline-flex items-center justify-center', currentPage === number ? 'border-[#2563eb] bg-[#eef3ff] text-[#2563eb]' : 'border-gray-200 bg-white')}
                    >
                      {number}
                    </Link>
                  )
                })}
                <Link href={href({ page: String(Math.min(totalPages, currentPage + 1)) }) + '#schedule-list'} className={clsx('btn text-xs px-2.5', currentPage === totalPages && 'pointer-events-none opacity-40')}>
                  ›
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <span>1ページあたりの行数: 8</span>
                <span>
                  {filteredRows.length === 0 ? '0' : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredRows.length)} / {filteredRows.length}件
                </span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
