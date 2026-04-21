import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STATUS_COLOR, STATUS_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '@/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'
import TaskProgressForm from '@/components/TaskProgressForm'
import CommentSection from '@/components/CommentSection'
import DeleteProjectButton from '@/components/DeleteProjectButton'
import DeletePhaseButton from '@/components/DeletePhaseButton'
import DeleteTaskButton from '@/components/DeleteTaskButton'
import ScheduleImportForm from '@/components/ScheduleImportForm'
import { deleteProject } from '../actions'
import { deletePhase } from './phases/actions'
import { deleteTask } from './phases/[phaseId]/tasks/actions'
import { updateTaskListItem } from '../../tasks/actions'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      owner:users(name),
      phases(
        *,
        tasks(*, assignee:users(name))
      )
    `)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!project) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'
  const deleteAction = deleteProject.bind(null, Number(project.id))

  const phases = ((project.phases as any[]) ?? [])
    .filter((phase: any) => !phase.deleted_at)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const allTasks = phases.flatMap((p: any) => (p.tasks ?? []).filter((task: any) => !task.deleted_at))
  const autoProgress = allTasks.length
    ? Math.round((allTasks.filter((t: any) => t.status === 'completed').length / allTasks.length) * 100)
    : 0

  const status = project.status as keyof typeof STATUS_COLOR

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/projects" className="hover:text-gray-600">
              案件一覧
            </Link>
            <span>›</span>
            <span className="text-gray-600">{project.name}</span>
          </div>
          <h1 className="text-base font-semibold">{project.name}</h1>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link href={`/projects/${project.id}/edit`} className="btn">
              編集
            </Link>
            <DeleteProjectButton action={deleteAction} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="text-xs font-medium text-gray-700 mb-3">案件情報</h2>
          <dl className="space-y-2 text-xs">
            {[
              [
                'ステータス',
                <span className={clsx('badge', STATUS_COLOR[status])}>{STATUS_LABEL[status]}</span>,
              ],
              ['責任者', (project.owner as any)?.name ?? '—'],
              ['開始日', project.start_date ?? '—'],
              ['終了予定', project.end_date ?? '—'],
              ['進捗率', `${project.progress ?? 0}%（参考：タスク完了率 ${autoProgress}%）`],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <dt className="w-20 text-gray-400 shrink-0">{label}</dt>
                <dd className="text-gray-800">{value as any}</dd>
              </div>
            ))}
          </dl>
        </div>

        <CommentSection entityType="project" entityId={project.id} currentUserId={user!.id} />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xs font-medium text-gray-700">工程・タスク</h2>
            <p className="text-xs text-gray-400 mt-1">
              CSV / Excelで書き出しできます。管理者は編集後の再取り込みにも対応しています。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a href={`/projects/${project.id}/export/csv`} className="btn text-xs">
              CSV出力
            </a>
            <a href={`/projects/${project.id}/export/xlsx`} className="btn text-xs">
              Excel出力
            </a>
            {isAdmin && <ScheduleImportForm projectId={Number(project.id)} />}
            {isAdmin && (
              <Link href={`/projects/${project.id}/phases/new`} className="btn text-xs">
                ＋ 工程追加
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {phases.map((phase: any) => {
            const phaseDeleteAction = deletePhase.bind(null, Number(project.id), Number(phase.id))
            const tasks = ((phase.tasks as any[]) ?? []).filter((task: any) => !task.deleted_at)

            return (
              <div key={phase.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-800">{phase.name}</span>
                  <span className={clsx('badge', STATUS_COLOR[phase.status as keyof typeof STATUS_COLOR])}>
                    {STATUS_LABEL[phase.status as keyof typeof STATUS_LABEL]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {phase.start_date ?? '—'} 〜 {phase.end_date ?? '—'}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{phase.progress}%</span>
                  {isAdmin && (
                    <div className="flex items-center gap-2 ml-2">
                      <Link href={`/projects/${project.id}/phases/${phase.id}/tasks/new`} className="btn text-xs">
                        タスク追加
                      </Link>
                      <Link href={`/projects/${project.id}/phases/${phase.id}/edit`} className="btn text-xs">
                        編集
                      </Link>
                      <DeletePhaseButton action={phaseDeleteAction} />
                    </div>
                  )}
                </div>

                {tasks.map((task: any) => {
                  const overdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed'
                  const isMyTask = task.assignee_id === user?.id
                  const taskStatus = task.status as keyof typeof STATUS_COLOR
                  const taskDeleteAction = deleteTask.bind(null, Number(project.id), Number(phase.id), Number(task.id))
                  const taskProgressAction = updateTaskListItem.bind(null, Number(task.id))

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <span className="flex-1 text-xs text-gray-800">{task.name}</span>
                      {task.assignee && (
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-medium flex items-center justify-center shrink-0">
                          {task.assignee.name.charAt(0)}
                        </span>
                      )}
                      <span className={clsx('badge', overdue ? 'bg-red-100 text-red-700' : STATUS_COLOR[taskStatus])}>
                        {overdue ? '遅延' : STATUS_LABEL[taskStatus]}
                      </span>
                      <span className={clsx('badge', PRIORITY_COLOR[task.priority as keyof typeof PRIORITY_COLOR])}>
                        {PRIORITY_LABEL[task.priority as keyof typeof PRIORITY_LABEL]}
                      </span>
                      {(isAdmin || isMyTask) && (
                        <TaskProgressForm
                          action={taskProgressAction}
                          currentProgress={task.progress}
                          currentStatus={task.status}
                        />
                      )}
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${project.id}/phases/${phase.id}/tasks/${task.id}/edit`}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            編集
                          </Link>
                          <DeleteTaskButton action={taskDeleteAction} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
