import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  buildScheduleExportRows,
  buildScheduleWorkbook,
  sanitizeDownloadName,
} from '@/lib/project-schedule-transfer'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const projectId = Number(params.id)
  if (!Number.isFinite(projectId)) {
    return NextResponse.redirect(new URL('/projects', 'http://localhost'))
  }

  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', 'http://localhost'))
  }

  const { data: project } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      phases(
        id,
        name,
        status,
        progress,
        sort_order,
        start_date,
        end_date,
        note,
        deleted_at,
        tasks(
          id,
          name,
          status,
          progress,
          priority,
          start_date,
          end_date,
          description,
          note,
          deleted_at,
          assignee:users(login_id, name)
        )
      )
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) {
    return NextResponse.redirect(new URL('/projects', 'http://localhost'))
  }

  const workbook = buildScheduleWorkbook(project.name, buildScheduleExportRows(project))

  return new NextResponse(workbook as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${sanitizeDownloadName(projectId, 'xlsx')}"`,
    },
  })
}
