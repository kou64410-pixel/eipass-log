'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const TYPES = [
  { id: 'MC',     label: 'MC（アビタス）',  desc: 'Multiple Choice 多肢選択式' },
  { id: 'TBS',    label: 'TBS（アビタス）', desc: 'Task-Based Simulation シミュレーション' },
  { id: 'RQ-MC',  label: 'MC（RQ）',        desc: 'Released Question 多肢選択式' },
  { id: 'RQ-TBS', label: 'TBS（RQ）',       desc: 'Released Question シミュレーション' },
]

export default function TypeSelectPage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const [code, setCode] = useState<string | null>(null)
  const [typeCounts, setTypeCounts] = useState<Record<string, { total: number; maru: number; sankaku: number; batsu: number }>>({})

  useEffect(() => {
    const saved = localStorage.getItem('eipass_code')
    if (!saved) {
      router.replace('/')
      return
    }
    setCode(saved)
    fetchTypeCounts(saved)
  }, [router, subject])

  async function fetchTypeCounts(inviteCode: string) {
    const { data } = await supabase
      .from('results')
      .select('type, rating')
      .eq('code', inviteCode)
      .eq('subject', subject)

    if (!data) return

    const counts: Record<string, { total: number; maru: number; sankaku: number; batsu: number }> = {}
    for (const r of data) {
      const t = r.type || 'MC'
      if (!counts[t]) counts[t] = { total: 0, maru: 0, sankaku: 0, batsu: 0 }
      counts[t].total++
      if (r.rating === '○') counts[t].maru++
      if (r.rating === '△') counts[t].sankaku++
      if (r.rating === '×') counts[t].batsu++
    }
    setTypeCounts(counts)
  }

  if (!code) return null

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/subject" className="p-2 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{subject}</h1>
            <p className="text-sm text-slate-500">問題タイプを選択</p>
          </div>
        </div>

        <div className="space-y-3">
          {TYPES.map(type => {
            const counts = typeCounts[type.id]
            return (
              <Link
                key={type.id}
                href={`/subject/${subject}/${type.id}`}
                className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">{type.label}</span>
                    <p className="text-slate-500 text-sm mt-1">{type.desc}</p>
                    {counts && (
                      <div className="flex gap-3 mt-2">
                        <span className="text-sm font-medium text-green-600">○ {counts.maru}</span>
                        <span className="text-sm font-medium text-yellow-500">△ {counts.sankaku}</span>
                        <span className="text-sm font-medium text-red-500">× {counts.batsu}</span>
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
