import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import ProjectForm from '@/components/ProjectForm'

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/projects')

  const [{ data: project }, { data: users }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).single(),
    supabase.from('users').select('id, name').eq('is_active', true),
  ])

  if (!project) notFound()

  return (
    <div className="p-6">
      <h1 className="text-base font-semibold mb-6">案件編集</h1>
      <ProjectForm project={project} users={users ?? []} currentUserId={user!.id} />
    </div>
  )
}
