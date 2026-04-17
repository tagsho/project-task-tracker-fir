import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProjectForm from '@/components/ProjectForm'
import { createProject } from '../actions'

export default async function NewProjectPage() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/projects')

  const { data: users } = await supabase
    .from('users')
    .select('id, name, login_id, role, is_active, created_at')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Link href="/projects" className="hover:text-gray-600">案件一覧</Link>
        <span>›</span>
        <span className="text-gray-600">新規作成</span>
      </div>
      <h1 className="text-base font-semibold mb-6">案件新規作成</h1>
      <ProjectForm users={users ?? []} currentUserId={user!.id} action={createProject} />
    </div>
  )
}
