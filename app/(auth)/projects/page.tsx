import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATUS_LABEL } from '@/types'
import type { ProjectStatus } from '@/types'
import Link from 'next/link'
import clsx from 'clsx'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import { deleteProject, updateProjectStatus } from './actions'

const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ['pending', 'in_progress', 'completed', 'on_hold']

function autoProgress(phases: any[]): number {
  const tasks = phases?.flatMap((phase: any) => phase.tasks ?? []) ?? []
  if (!tasks.length) return 0
  return Math.round(tasks.filter((task: any) => task.status === 'completed').length / tasks.length * 100)
}

export default async function ProjectsPage() {
  const supabase = createServerSupabaseClient()

  const [{ data: projects }, { data: { user } }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, start_date, end_date, owner:users(name), phases(tasks(status))')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ])

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold">案件一覧</h1>
        {isAdmin && (
          <Link href="/projects/new" className="btn text-xs">
            ＋ 案件追加
          </Link>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="text-left font-medium px-4 py-3">案件名</th>
              <th className="text-left font-medium px-4 py-3">ステータス</th>
              <th className="text-left font-medium px-4 py-3">責任者</th>
              <th className="text-left font-medium px-4 py-3">期間</th>
              <th className="text-right font-medium px-4 py-3">進捗</th>
              {isAdmin && <th className="text-right font-medium px-4 py-3">操作</th>}
            </tr>
          </thead>
          <tbody>
            {projects?.map((project: any) => {
              const progress = autoProgress(project.phases ?? [])
              const status = project.status as ProjectStatus
              const deleteAction = deleteProject.bind(null, Number(project.id))
              const statusAction = updateProjectStatus.bind(null, Number(project.id))

              return (
                <tr key={project.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${project.id}`} className="font-medium text-gray-800 hover:text-indigo-600">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <form action={statusAction} className="flex items-center gap-2">
                        <select
                          name="status"
                          defaultValue={status}
                          className="input min-w-[120px] py-1.5 h-9"
                          aria-label={`${project.name} のステータス`}
                        >
                          {PROJECT_STATUS_OPTIONS.map(option => (
                            <option key={option} value={option}>
                              {STATUS_LABEL[option]}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="btn text-xs whitespace-nowrap">
                          更新
                        </button>
                      </form>
                    ) : (
                      <span className={clsx(
                        'badge',
                        status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : status === 'on_hold'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                      )}>
                        {STATUS_LABEL[status]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{project.owner?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {project.start_date ?? '—'} 〜 {project.end_date ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{progress}%</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/projects/${project.id}/edit`} className="btn text-xs">
                          編集
                        </Link>
                        <DeleteProjectButton action={deleteAction} />
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {!projects?.length && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-400 mb-3">案件はまだありません</p>
            {isAdmin && (
              <Link href="/projects/new" className="btn-primary text-xs">
                案件を作成
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
