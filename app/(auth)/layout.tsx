import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headerStore = headers()
  const forwardedUserId = headerStore.get('x-auth-user-id')
  const forwardedUserEmail = headerStore.get('x-auth-user-email')
  const forwardedUserName = headerStore.get('x-auth-user-name')
  const forwardedUserRole = headerStore.get('x-auth-user-role')

  if (!forwardedUserId) redirect('/login')

  return (
    <div className="flex min-h-screen bg-[#f6f8fc] text-gray-900">
      <Sidebar
        userName={forwardedUserName || forwardedUserEmail || ''}
        isAdmin={forwardedUserRole === 'admin'}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
