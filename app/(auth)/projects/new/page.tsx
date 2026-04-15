import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProjectForm from '@/components/ProjectForm'

export default async function NewProjectPage() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/projects')

  const { data: users } = await supabase.from('users').select('*').eq('is_active', true)

  return (
    <div className="p-6">
      <h1 className="text-base font-semibold mb-6">案件新規作成</h1>
      <ProjectForm users={users ?? []} currentUserId={user!.id} />
    </div>
  )
}
