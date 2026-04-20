import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PhaseForm from '@/components/PhaseForm'
import { updatePhase } from '../../actions'

export default async function EditPhasePage({ params }: { params: { id: string; phaseId: string } }) {
  const supabase = createServerSupabaseClient()
  const projectId = Number(params.id)
  const phaseId = Number(params.phaseId)

  if (!Number.isFinite(projectId) || !Number.isFinite(phaseId)) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect(`/projects/${params.id}`)

  const [{ data: project }, { data: phase }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('phases')
      .select('*')
      .eq('id', phaseId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single(),
  ])

  if (!project || !phase) notFound()

  const action = updatePhase.bind(null, projectId, phaseId)

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Link href="/projects" className="hover:text-gray-600">案件一覧</Link>
        <span>›</span>
        <Link href={`/projects/${project.id}`} className="hover:text-gray-600">{project.name}</Link>
        <span>›</span>
        <span className="text-gray-600">{phase.name}</span>
      </div>
      <h1 className="text-base font-semibold mb-6">工程編集</h1>
      <PhaseForm projectId={projectId} phase={phase} action={action} />
    </div>
  )
}
