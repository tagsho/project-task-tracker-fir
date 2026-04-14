import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Sidebar from '@/components/Sidebar'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // usersテーブルからロールを取得
  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={profile?.name ?? user.email ?? ''}
        isAdmin={profile?.role === 'admin'}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
