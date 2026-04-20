import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import TaskForm from '@/components/TaskForm'
import { updateTask } from '../../actions'

export default async function EditTaskPage({ params }: { params: { id: string; phaseId: string; taskId: string } }) {
  const supabase = createServerSupabaseClient()
  const projectId = Number(params.id)
  const phaseId = Number(params.phaseId)
  const taskId = Number(params.taskId)

  if (!Number.isFinite(projectId) || !Number.isFinite(phaseId) || !Number.isFinite(taskId)) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect(`/projects/${params.id}`)

  const [{ data: project }, { data: phase }, { data: task }, { data: users }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('phases')
      .select('id, name')
      .eq('id', phaseId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('phase_id', phaseId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('users')
      .select('id, name, login_id, role, is_active, created_at')
      .eq('is_active', true)
      .order('name'),
  ])

  if (!project || !phase || !task) notFound()

  const action = updateTask.bind(null, projectId, phaseId, taskId)

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Link href="/projects" className="hover:text-gray-600">案件一覧</Link>
        <span>›</span>
        <Link href={`/projects/${project.id}`} className="hover:text-gray-600">{project.name}</Link>
        <span>›</span>
        <span className="text-gray-600">{phase.name}</span>
      </div>
      <h1 className="text-base font-semibold mb-6">タスク編集</h1>
      <TaskForm projectId={projectId} phaseId={phaseId} task={task} users={users ?? []} action={action} />
    </div>
  )
}
