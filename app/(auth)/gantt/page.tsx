import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import GanttChart from '@/components/GanttChart'
import { measureServerStep, logServerSummary } from '@/lib/perf'

export default async function GanttPage({ searchParams }: { searchParams: { project_id?: string } }) {
  const supabase = createServerSupabaseClient()
  const headerStore = headers()
  const pageStartedAt = Date.now()
  const isAdmin = headerStore.get('x-auth-user-role') === 'admin'

  const projectsResult = await measureServerStep('gantt:projects', () =>
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'in_progress')
      .is('deleted_at', null)
      .order('name'),
  )

  const projects = projectsResult.data
  const selectedId = searchParams.project_id ?? projects?.[0]?.id?.toString()

  let tasks: any[] = []
  if (selectedId) {
    const phasesResult = await measureServerStep(`gantt:phases:${selectedId}`, () =>
      supabase
        .from('phases')
        .select('name, tasks(id, name, start_date, end_date, progress, status, assignee:users(name))')
        .eq('project_id', selectedId)
        .is('deleted_at', null)
        .order('sort_order'),
    )

    tasks = (phasesResult.data ?? []).flatMap(phase =>
      (phase.tasks ?? [])
        .filter((t: any) => t.start_date && t.end_date)
        .map((t: any) => ({
          id: String(t.id),
          name: t.name,
          start: t.start_date,
          end: t.end_date,
          progress: t.progress,
          assignee: t.assignee?.name,
          status: t.status,
          phase: phase.name,
        })),
    )
  }

  logServerSummary('gantt:summary', {
    selectedProjectId: selectedId ?? null,
    projectOptions: projects?.length ?? 0,
    taskBars: tasks.length,
    durationMs: Date.now() - pageStartedAt,
  })

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-base font-semibold">ガントチャート</h1>
        <form action="/gantt" className="flex items-center gap-2">
          <select
            name="project_id"
            defaultValue={selectedId}
            className="input w-64 text-xs"
          >
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit" className="btn text-xs">
            表示
          </button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <GanttChart tasks={tasks} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
