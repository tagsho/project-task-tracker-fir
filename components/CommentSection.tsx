'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { EntityType, Comment } from '@/types'

export default function CommentSection({
  entityType,
  entityId,
  currentUserId,
}: {
  entityType: EntityType
  entityId: number
  currentUserId: string
}) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [entityId])

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users(name)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null)
      .order('created_at')
    setComments((data as any) ?? [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    await supabase.from('comments').insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: currentUserId,
      body: body.trim(),
    })
    setBody('')
    setSending(false)
    fetchComments()
  }

  return (
    <div className="card flex flex-col">
      <h2 className="text-xs font-medium text-gray-700 mb-3">コメント</h2>

      <div className="flex-1 space-y-3 mb-3 max-h-48 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400">コメントはまだありません</p>
        )}
        {comments.map(comment => (
          <div key={comment.id} className="text-xs border-b border-gray-100 pb-2 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-700">{(comment.user as any)?.name}</span>
              <span className="text-gray-400">
                {format(new Date(comment.created_at), 'M/d HH:mm', { locale: ja })}
              </span>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{comment.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="コメントを入力"
          className="input flex-1 text-xs"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="btn-primary disabled:opacity-40 text-xs"
        >
          送信
        </button>
      </form>
    </div>
  )
}
