import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserTable from '@/components/UserTable'

export default async function UsersPage() {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold">ユーザー管理</h1>
      </div>
      <UserTable users={users ?? []} currentUserId={user!.id} />
    </div>
  )
}
