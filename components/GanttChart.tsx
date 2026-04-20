'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type GanttConstructor = new (svg: SVGElement | null, tasks: any[], options: Record<string, unknown>) => any

export default function GanttChart({ tasks, isAdmin }: { tasks: any[]; isAdmin: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<any>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return

    let cancelled = false

    async function loadGantt() {
      const module = await import('frappe-gantt/dist/frappe-gantt.min.js')
      if (cancelled) return

      const Gantt = ((module as any).default ?? module) as GanttConstructor
      initGantt(Gantt)
    }

    loadGantt()

    return () => {
      cancelled = true
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [tasks, isAdmin, supabase])

  function initGantt(Gantt: GanttConstructor) {
    if (!containerRef.current) return

    containerRef.current.innerHTML = '<svg></svg>'
    const svg = containerRef.current.querySelector('svg')

    ganttRef.current = new Gantt(svg, tasks, {
      view_mode: 'Week',
      language: 'ja',
      on_date_change: async (task: any, start: Date, end: Date) => {
        if (!isAdmin) return
        await supabase.from('tasks').update({
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        }).eq('id', Number(task.id))
      },
      on_progress_change: async (task: any, progress: number) => {
        await supabase.from('tasks').update({
          progress: Math.round(progress),
          updated_at: new Date().toISOString(),
        }).eq('id', Number(task.id))
      },
    })
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500 mb-3">開始日・終了日が設定されたタスクがありません</p>
        <Link href="/projects" className="btn text-xs">
          案件一覧へ
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 p-3 border-b border-gray-200">
        {(['Day', 'Week', 'Month'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => ganttRef.current?.change_view_mode(mode)}
            className="btn text-xs"
          >
            {{ Day: '日', Week: '週', Month: '月' }[mode]}
          </button>
        ))}
        {!isAdmin && (
          <span className="ml-auto text-xs text-gray-400 self-center">※ 日程変更は管理者のみ</span>
        )}
      </div>
      <div ref={containerRef} className="overflow-x-auto p-4 min-h-64" />
    </div>
  )
}
