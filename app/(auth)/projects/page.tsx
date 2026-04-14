import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATUS_COLOR, STATUS_LABEL } from '@/types'
import Link from 'next/link'
import clsx from 'clsx'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string }
}) {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('projects')
    .select('*, owner:users(name)')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.q) query = query.ilike('name', `%${searchParams.q}%`)

  const { data: projects } = await query

  // ユーザー情報（管理者判定）
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold">案件一覧</h1>
        {isAdmin && (
          <Link href="/projects/new" className="btn-primary">
            ＋ 新規作成
          </Link>
        )}
      </div>

      {/* 検索・フィルター */}
      <form className="flex gap-2 mb-4">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="案件名で検索"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={searchParams.status} className="input w-32">
          <option value="">すべて</option>
          <option value="pending">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="completed">完了</option>
          <option value="on_hold">保留</option>
        </select>
        <button type="submit" className="btn">絞り込み</button>
      </form>

      {/* 案件テーブル */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">案件名</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">責任者</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">ステータス</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">終了予定</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {projects?.map(project => (
              <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
                <td className="px-4 py-3 text-gray-600">{(project.owner as any)?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={clsx('badge', STATUS_COLOR[project.status])}>
                    {STATUS_LABEL[project.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{project.end_date ?? '—'}</td>
                <td className="px-4 py-3">
                  <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:underline">
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
            {!projects?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">案件がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
