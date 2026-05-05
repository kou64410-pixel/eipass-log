'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const SUBJECTS = ['FAR', 'BAR', 'REG', 'AUD']
const TYPES = ['MC', 'TBS']
const ROUNDS = [1, 2, 3]

type Counts = { maru: number; sankaku: number; batsu: number; total: number }
// subject -> type -> round -> counts
type SummaryData = Record<string, Record<string, Record<number, Counts>>>

export default function SummaryPage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('eipass_code')
    if (!saved) {
      router.replace('/')
      return
    }
    setCode(saved)
    fetchSummary(saved)
  }, [router])

  async function fetchSummary(inviteCode: string) {
    const { data } = await supabase
      .from('results')
      .select('subject, type, round, rating')
      .eq('code', inviteCode)

    if (!data) {
      setLoading(false)
      return
    }

    const result: SummaryData = {}
    for (const row of data) {
      const t = row.type || 'MC'
      if (!result[row.subject]) result[row.subject] = {}
      if (!result[row.subject][t]) result[row.subject][t] = {}
      if (!result[row.subject][t][row.round]) {
        result[row.subject][t][row.round] = { maru: 0, sankaku: 0, batsu: 0, total: 0 }
      }
      result[row.subject][t][row.round].total++
      if (row.rating === '○') result[row.subject][t][row.round].maru++
      if (row.rating === '△') result[row.subject][t][row.round].sankaku++
      if (row.rating === '×') result[row.subject][t][row.round].batsu++
    }

    setSummary(result)
    setLoading(false)
  }

  if (!code) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/subject" className="p-1 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-slate-800">進捗サマリー</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">読み込み中...</div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {SUBJECTS.map(subject => {
            const subjectData = summary[subject]
            const hasData = subjectData && Object.keys(subjectData).length > 0

            return (
              <div key={subject} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800">{subject}</h2>
                </div>

                {!hasData ? (
                  <div className="px-5 py-4 text-slate-400 text-sm">記録なし</div>
                ) : (
                  <div>
                    {TYPES.map(type => {
                      const typeData = subjectData?.[type]
                      if (!typeData || Object.keys(typeData).length === 0) return null

                      return (
                        <div key={type}>
                          {/* Type label */}
                          <div className="px-5 py-2 bg-slate-50 border-y border-slate-100">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              type === 'MC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>{type}</span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {ROUNDS.map(round => {
                              const data = typeData?.[round]
                              if (!data) return null

                              const pct = data.total > 0 ? Math.round((data.maru / data.total) * 100) : 0

                              return (
                                <div key={round} className="px-5 py-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-slate-700">{round}周目</span>
                                    <span className="text-sm text-slate-500">{data.total}問</span>
                                  </div>

                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                    <div
                                      className="h-full bg-green-400 rounded-full transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>

                                  <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm">○</span>
                                      <span className="text-slate-700 font-semibold">{data.maru}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 font-bold text-sm">△</span>
                                      <span className="text-slate-700 font-semibold">{data.sankaku}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-sm">×</span>
                                      <span className="text-slate-700 font-semibold">{data.batsu}</span>
                                    </div>
                                    <div className="ml-auto text-slate-500 text-sm font-medium">
                                      正答率 {pct}%
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
