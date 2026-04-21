import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATUS_COLOR, STATUS_LABEL } from '@/types'
import { differenceInCalendarDays, format, isPast, isToday } from 'date-fns'
import clsx from 'clsx'
import Link from 'next/link'

type SearchParams = {
  project_id?: string
}

type MilestoneRow = {
  id: number
  name: string
  status: keyof typeof STATUS_COLOR
  progress: number
  start_date: string | null
  end_date: string | null
  taskCount: number
  completedCount: number
  overdue: boolean
}

function parseDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default async function MilestonesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServerSupabaseClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  const selectedProjectId = searchParams.project_id ?? projects?.[0]?.id?.toString() ?? ''

  let phaseRows: MilestoneRow[] = []

  if (selectedProjectId) {
    const { data: phases } = await supabase
      .from('phases')
      .select(`
        id,
        name,
        status,
        progress,
        start_date,
        end_date,
        deleted_at,
        sort_order,
        tasks(id, status, end_date, deleted_at)
      `)
      .eq('project_id', selectedProjectId)
      .is('deleted_at', null)
      .order('sort_order')

    phaseRows = (phases ?? []).map((phase: any) => {
      const tasks = ((phase.tasks as any[]) ?? []).filter(task => !task.deleted_at)
      const completedCount = tasks.filter(task => task.status === 'completed').length
      const overdue = !!phase.end_date && isPast(new Date(phase.end_date)) && !isToday(new Date(phase.end_date)) && phase.status !== 'completed'

      return {
        id: phase.id,
        name: phase.name,
        status: phase.status,
        progress: Number(phase.progress ?? 0),
        start_date: phase.start_date,
        end_date: phase.end_date,
        taskCount: tasks.length,
        completedCount,
        overdue,
      }
    })
  }

  const totalCount = phaseRows.length
  const completedCount = phaseRows.filter(phase => phase.status === 'completed').length
  const activeCount = phaseRows.filter(phase => phase.status === 'in_progress').length
  const overdueCount = phaseRows.filter(phase => phase.overdue).length
  const upcoming = [...phaseRows]
    .filter(phase => phase.end_date && phase.status !== 'completed')
    .sort((a, b) => (a.end_date ?? '').localeCompare(b.end_date ?? ''))
    .slice(0, 6)

  return (
    <div className="px-6 py-5">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">マイルストーン</h1>
          <p className="mt-1 text-sm text-gray-400">工程の節目と完了状況をまとめて確認できます</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/schedule" className="btn text-xs">
            工程表へ
          </Link>
          <Link href="/gantt" className="btn text-xs">
            ガントチャートへ
          </Link>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <form action="/milestones" className="flex flex-wrap items-center gap-2">
          <select name="project_id" defaultValue={selectedProjectId} className="input w-[280px] text-xs">
            {projects?.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn text-xs">
            表示
          </button>
        </form>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs text-gray-500">全マイルストーン</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs text-gray-500">進行中</p>
          <p className={clsx('mt-1 text-2xl font-semibold', activeCount > 0 ? 'text-blue-600' : 'text-gray-500')}>{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs text-gray-500">完了</p>
          <p className={clsx('mt-1 text-2xl font-semibold', completedCount > 0 ? 'text-emerald-600' : 'text-gray-500')}>{completedCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs text-gray-500">遅延</p>
          <p className={clsx('mt-1 text-2xl font-semibold', overdueCount > 0 ? 'text-red-600' : 'text-gray-500')}>{overdueCount}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">工程別の進行状況</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {phaseRows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">表示できるマイルストーンはありません</div>
            ) : (
              phaseRows.map((phase, index) => {
                const startDate = parseDate(phase.start_date)
                const endDate = parseDate(phase.end_date)
                const duration = startDate && endDate ? differenceInCalendarDays(endDate, startDate) + 1 : null

                return (
                  <div key={phase.id} className="px-5 py-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-400">M{index + 1}</p>
                        <h3 className="text-sm font-semibold text-gray-900">{phase.name}</h3>
                      </div>
                      <span className={clsx('badge', phase.overdue ? 'bg-red-100 text-red-700' : STATUS_COLOR[phase.status])}>
                        {phase.overdue ? '遅延' : STATUS_LABEL[phase.status]}
                      </span>
                    </div>

                    <div className="mb-3 grid gap-3 text-xs text-gray-500 md:grid-cols-4">
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-gray-400">期間</p>
                        <p className="text-sm text-gray-700">{phase.start_date ?? '—'} ~ {phase.end_date ?? '—'}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-gray-400">日数</p>
                        <p className="text-sm text-gray-700">{duration ? `${duration}日` : '未設定'}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-gray-400">タスク</p>
                        <p className="text-sm text-gray-700">{phase.completedCount} / {phase.taskCount} 完了</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.08em] text-gray-400">進捗</p>
                        <p className="text-sm text-gray-700">{phase.progress}%</p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={clsx(
                          'h-full rounded-full',
                          phase.progress >= 100 ? 'bg-emerald-500' : phase.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, phase.progress))}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">近い締切</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {upcoming.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">期限が設定された工程はありません</div>
            ) : (
              upcoming.map(phase => (
                <div key={phase.id} className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-gray-900">{phase.name}</h3>
                    <span className={clsx('badge', phase.overdue ? 'bg-red-100 text-red-700' : STATUS_COLOR[phase.status])}>
                      {phase.overdue ? '遅延' : STATUS_LABEL[phase.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">期限: {phase.end_date ?? '未設定'}</p>
                  <p className="mt-2 text-xs text-gray-500">タスク {phase.taskCount}件 / 完了 {phase.completedCount}件</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
