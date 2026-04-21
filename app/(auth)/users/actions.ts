'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const USER_ROLES: Role[] = ['admin', 'member']

async function requireAdmin() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')
}

function redirectWithError(error: string) {
  redirect(`/users?error=${encodeURIComponent(error)}`)
}

export async function createUser(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'member') as Role

  if (!name || !email || !password) {
    redirectWithError('required')
  }

  if (!USER_ROLES.includes(role)) {
    redirectWithError('invalid-role')
  }

  let supabaseAdmin: ReturnType<typeof createAdminSupabaseClient>
  try {
    supabaseAdmin = createAdminSupabaseClient()
  } catch {
    redirectWithError('service-role-missing')
  }

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('login_id', email)
    .maybeSingle()

  if (existingUser) {
    redirectWithError('email-already-exists')
  }

  const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
    },
  })

  if (authError || !createdAuthUser.user) {
    redirectWithError(authError?.message || 'auth-create-failed')
  }

  const { error: profileError } = await supabaseAdmin
    .from('users')
    .upsert({
      id: createdAuthUser.user.id,
      name,
      login_id: email,
      role,
      is_active: true,
    }, { onConflict: 'id' })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.user.id)
    redirectWithError(profileError.message || 'profile-create-failed')
  }

  revalidatePath('/users')
  redirect('/users?created=1')
}
