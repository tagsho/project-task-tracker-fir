'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const USER_ROLES: Role[] = ['admin', 'member']

function redirectWithError(error: string) {
  redirect(`/users?error=${encodeURIComponent(error)}`)
}

async function requireAdminUser() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return { supabase, user }
}

function getSupabaseAdminClient(): ReturnType<typeof createAdminSupabaseClient> {
  try {
    return createAdminSupabaseClient()
  } catch {
    redirectWithError('service-role-missing')
    throw new Error('unreachable')
  }
}

function requireCreatedUser<T extends { user: { id: string } | null }>(createdAuthUser: T) {
  if (!createdAuthUser.user) {
    redirectWithError('auth-create-failed')
    throw new Error('unreachable')
  }

  return createdAuthUser.user
}

export async function createUser(formData: FormData) {
  await requireAdminUser()

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

  const supabaseAdmin = getSupabaseAdminClient()

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

  if (authError || !createdAuthUser) {
    redirectWithError('auth-create-failed')
  }

  const createdUser = requireCreatedUser(createdAuthUser)

  const { error: profileError } = await supabaseAdmin.from('users').upsert(
    {
      id: createdUser.id,
      name,
      login_id: email,
      role,
      is_active: true,
    },
    { onConflict: 'id' },
  )

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(createdUser.id)
    redirectWithError('profile-create-failed')
  }

  revalidatePath('/users')
  redirect('/users?created=1')
}

export async function updateUserRole(userId: string, formData: FormData) {
  const { supabase, user } = await requireAdminUser()
  const role = String(formData.get('role') ?? '') as Role

  if (userId === user.id) {
    redirectWithError('self-protected')
  }

  if (!USER_ROLES.includes(role)) {
    redirectWithError('invalid-role')
  }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    redirectWithError('user-update-failed')
  }

  revalidatePath('/users')
}

export async function updateUserActive(userId: string, formData: FormData) {
  const { supabase, user } = await requireAdminUser()
  const isActive = String(formData.get('is_active') ?? 'true') === 'true'

  if (userId === user.id) {
    redirectWithError('self-protected')
  }

  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) {
    redirectWithError('user-update-failed')
  }

  revalidatePath('/users')
}
