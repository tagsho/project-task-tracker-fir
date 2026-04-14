import { createServerSupabaseClient } from '@/lib/supabase-server'
import GanttChart from '@/components/GanttChart'

export default async function GanttPage({ searchParams }: { searchParams: { project_id?: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'in_progress')
    .is('deleted_at', null)
    .order('name')

  const selectedId = searchParams.project_id ?? projects?.[0]?.id?.toString()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  let tasks: any[] = []
  if (selectedId) {
    const { data: phases } = await supabase
      .from('phases')
      .select('*, tasks(*, assignee:users(name))')
      .eq('project_id', selectedId)
      .is('deleted_at', null)
      .order('sort_order')

    tasks = (phases ?? []).flatMap(phase =>
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
        }))
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-base font-semibold">ガントチャート</h1>
        <form>
          <select
            name="project_id"
            defaultValue={selectedId}
            onChange={e => {
              const url = new URL(window.location.href)
              url.searchParams.set('project_id', e.target.value)
              window.location.href = url.toString()
            }}
            className="input w-64 text-xs"
          >
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <GanttChart tasks={tasks} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
