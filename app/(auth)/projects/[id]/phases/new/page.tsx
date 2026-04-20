import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PhaseForm from '@/components/PhaseForm'
import { createPhase } from '../actions'

export default async function NewPhasePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const projectId = Number(params.id)

  if (!Number.isFinite(projectId)) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect(`/projects/${params.id}`)

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) notFound()

  const action = createPhase.bind(null, projectId)

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Link href="/projects" className="hover:text-gray-600">案件一覧</Link>
        <span>›</span>
        <Link href={`/projects/${project.id}`} className="hover:text-gray-600">{project.name}</Link>
        <span>›</span>
        <span className="text-gray-600">工程追加</span>
      </div>
      <h1 className="text-base font-semibold mb-6">工程追加</h1>
      <PhaseForm projectId={projectId} action={action} />
    </div>
  )
}
