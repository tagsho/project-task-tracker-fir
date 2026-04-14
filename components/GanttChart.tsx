'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

declare const Gantt: any

export default function GanttChart({ tasks, isAdmin }: { tasks: any[]; isAdmin: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return

    // Frappe GanttはCDN経由でロード
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.min.js'
    script.onload = () => initGantt()
    document.head.appendChild(script)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/frappe-gantt@0.6.1/dist/frappe-gantt.css'
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(script)
    }
  }, [tasks])

  function initGantt() {
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
      <div className="p-8 text-center text-sm text-gray-400">
        開始日・終了日が設定されたタスクがありません
      </div>
    )
  }

  return (
    <div>
      {/* 表示切替 */}
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
