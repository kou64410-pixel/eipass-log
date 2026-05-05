'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const ROUNDS = [
  { num: 1, label: '1周目', desc: '全問題に挑戦' },
  { num: 2, label: '2周目', desc: '△・×の問題のみ' },
  { num: 3, label: '3周目', desc: '△・×の問題のみ' },
]

export default function RoundPage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const type = params.type as string
  const [code, setCode] = useState<string | null>(null)
  const [roundCounts, setRoundCounts] = useState<Record<number, { total: number; maru: number; sankaku: number; batsu: number }>>({})

  useEffect(() => {
    const saved = localStorage.getItem('eipass_code')
    if (!saved) {
      router.replace('/')
      return
    }
    setCode(saved)
    fetchRoundCounts(saved)
  }, [router, subject, type])

  async function fetchRoundCounts(inviteCode: string) {
    const { data } = await supabase
      .from('results')
      .select('round, rating')
      .eq('code', inviteCode)
      .eq('subject', subject)
      .eq('type', type)

    if (!data) return

    const counts: Record<number, { total: number; maru: number; sankaku: number; batsu: number }> = {}
    for (const r of data) {
      if (!counts[r.round]) counts[r.round] = { total: 0, maru: 0, sankaku: 0, batsu: 0 }
      counts[r.round].total++
      if (r.rating === '○') counts[r.round].maru++
      if (r.rating === '△') counts[r.round].sankaku++
      if (r.rating === '×') counts[r.round].batsu++
    }
    setRoundCounts(counts)
  }

  if (!code) return null

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/subject/${subject}`} className="p-2 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{subject} — {type}</h1>
            <p className="text-sm text-slate-500">周回を選択</p>
          </div>
        </div>

        <div className="space-y-3">
          {ROUNDS.map(round => {
            const counts = roundCounts[round.num]
            const prevCounts = round.num > 1 ? roundCounts[round.num - 1] : null
            const available = round.num === 1 || (prevCounts && (prevCounts.sankaku + prevCounts.batsu) > 0)

            return (
              <Link
                key={round.num}
                href={`/subject/${subject}/${type}/${round.num}`}
                className={`block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-colors ${
                  available ? 'active:bg-slate-50' : 'opacity-40 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-slate-800">{round.label}</span>
                    <p className="text-slate-500 text-sm mt-1">{round.desc}</p>
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
