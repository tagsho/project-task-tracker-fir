import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ProjectForm from '@/components/ProjectForm'
import { updateProject } from '../../actions'

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const projectId = Number(params.id)

  if (!Number.isFinite(projectId)) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect(`/projects/${params.id}`)

  const [{ data: project }, { data: users }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('users')
      .select('id, name, login_id, role, is_active, created_at')
      .eq('is_active', true)
      .order('name'),
  ])

  if (!project) notFound()

  const action = updateProject.bind(null, projectId)

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Link href="/projects" className="hover:text-gray-600">案件一覧</Link>
        <span>›</span>
        <Link href={`/projects/${project.id}`} className="hover:text-gray-600">{project.name}</Link>
        <span>›</span>
        <span className="text-gray-600">編集</span>
      </div>
      <h1 className="text-base font-semibold mb-6">案件編集</h1>
      <ProjectForm project={project} users={users ?? []} currentUserId={user!.id} action={action} />
    </div>
  )
}
