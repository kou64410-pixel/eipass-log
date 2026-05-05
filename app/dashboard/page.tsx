'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const DAY_JP = ['日', '月', '火', '水', '木', '金', '土']

function extractChapter(qno: string): number | null {
  const patterns = [
    /^(\d{1,2})[-_]/,
    /^[A-Za-z]+[-_](\d{1,2})[-_]/,
    /^[A-Za-z]+0*(\d{1,2})/,
    /^0*(\d{1,2})$/,
  ]
  for (const p of patterns) {
    const m = qno.match(p)
    if (m) {
      const n = parseInt(m[1])
      if (n >= 1 && n <= 21) return n
    }
  }
  return null
}

type DashData = {
  totalQ: number
  r1Count: number
  maru: number
  sankaku: number
  batsu: number
  chapterDist: { ch: number; sankaku: number; batsu: number }[]
  dailyCounts: { date: string; dayLabel: string; count: number }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('eipass_code')
    if (!saved) { router.replace('/'); return }
    setCode(saved)
    loadData(saved)
  }, [router])

  async function loadData(inviteCode: string) {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]

    const [{ count: totalQ }, { data: r1Results }, { data: recentResults }] = await Promise.all([
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('results').select('question_no, rating').eq('code', inviteCode).eq('round', 1),
      supabase.from('results').select('answered_at').eq('code', inviteCode).gte('answered_at', fromDate).lte('answered_at', today),
    ])

    // Build daily counts for last 7 days
    const dailyCounts: DashData['dailyCounts'] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dailyCounts.push({
        date: d.toISOString().split('T')[0],
        dayLabel: DAY_JP[d.getDay()],
        count: 0,
      })
    }
    if (recentResults) {
      for (const r of recentResults) {
        const idx = dailyCounts.findIndex(d => d.date === r.answered_at)
        if (idx >= 0) dailyCounts[idx].count++
      }
    }

    let maru = 0, sankaku = 0, batsu = 0
    const chMap: Record<number, { sankaku: number; batsu: number }> = {}
    if (r1Results) {
      for (const r of r1Results) {
        if (r.rating === '○') maru++
        else if (r.rating === '△') sankaku++
        else if (r.rating === '×') batsu++
        const ch = extractChapter(r.question_no)
        if (ch) {
          if (!chMap[ch]) chMap[ch] = { sankaku: 0, batsu: 0 }
          if (r.rating === '△') chMap[ch].sankaku++
          if (r.rating === '×') chMap[ch].batsu++
        }
      }
    }

    const chapterDist = Array.from({ length: 21 }, (_, i) => ({
      ch: i + 1,
      sankaku: chMap[i + 1]?.sankaku ?? 0,
      batsu: chMap[i + 1]?.batsu ?? 0,
    }))

    setData({
      totalQ: totalQ ?? 639,
      r1Count: r1Results?.length ?? 0,
      maru,
      sankaku,
      batsu,
      chapterDist,
      dailyCounts,
    })
    setLoading(false)
  }

  if (!code) return null

  const completionPct = data ? Math.min(Math.round((data.r1Count / data.totalQ) * 100), 100) : 0
  const maxChBar = data ? Math.max(...data.chapterDist.map(c => c.sankaku + c.batsu), 1) : 1
  const maxDay = data ? Math.max(...data.dailyCounts.map(d => d.count), 1) : 1

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/subject" className="p-1 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-slate-800">ダッシュボード</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">読み込み中...</div>
        </div>
      ) : data && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* 1. 1周目完了率 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">1周目 完了率</h2>
            <p className="text-sm text-slate-500 mb-3">
              {data.totalQ}問中{' '}
              <span className="text-slate-800 font-bold text-base">{data.r1Count}問</span>
              {' '}完了（
              <span className="text-blue-600 font-bold">{completionPct}%</span>
              ）
            </p>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* 2. 理解度の内訳（1周目） */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">理解度の内訳（1周目）</h2>
            <div className="flex gap-3">
              <div className="flex-1 bg-green-50 rounded-xl p-3 text-center border border-green-100">
                <p className="text-2xl font-bold text-green-600">○</p>
                <p className="text-xl font-bold text-green-700 mt-1">{data.maru}</p>
                <p className="text-xs text-green-600 mt-0.5">理解</p>
              </div>
              <div className="flex-1 bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                <p className="text-2xl font-bold text-yellow-500">△</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">{data.sankaku}</p>
                <p className="text-xs text-yellow-500 mt-0.5">要復習</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-3 text-center border border-red-100">
                <p className="text-2xl font-bold text-red-500">×</p>
                <p className="text-xl font-bold text-red-600 mt-1">{data.batsu}</p>
                <p className="text-xs text-red-500 mt-0.5">未理解</p>
              </div>
            </div>
          </div>

          {/* 3. Chapter別 理解度分布 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-4">Chapter別 理解度分布（1周目）</h2>
            <div className="space-y-1.5">
              {data.chapterDist.map(({ ch, sankaku, batsu: b }) => {
                const sankakuW = (sankaku / maxChBar) * 100
                const batsuW = (b / maxChBar) * 100
                const total = sankaku + b
                return (
                  <div key={ch} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-8 shrink-0 text-right font-mono">
                      {ch}
                    </span>
                    <div className="flex-1 flex gap-0.5 h-4 bg-slate-50 rounded-sm overflow-hidden">
                      {sankaku > 0 && (
                        <div
                          className="h-full bg-yellow-400 rounded-sm"
                          style={{ width: `${sankakuW}%` }}
                          title={`△ ${sankaku}`}
                        />
                      )}
                      {b > 0 && (
                        <div
                          className="h-full bg-red-400 rounded-sm"
                          style={{ width: `${batsuW}%` }}
                          title={`× ${b}`}
                        />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 w-5 shrink-0 text-right">
                      {total > 0 ? total : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />
                △ 要復習
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
                × 未理解
              </span>
            </div>
          </div>

          {/* 4. 直近7日間の学習ペース */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-4">直近7日間の学習ペース</h2>
            <div className="flex items-end gap-1.5" style={{ height: '100px' }}>
              {data.dailyCounts.map(({ date, dayLabel, count }) => {
                const barH = count > 0 ? Math.max((count / maxDay) * 72, 4) : 0
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    {count > 0 && (
                      <span className="text-xs text-slate-500 leading-none">{count}</span>
                    )}
                    <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                      {barH > 0 ? (
                        <div
                          className="w-full bg-blue-400 rounded-t-sm"
                          style={{ height: `${barH}px` }}
                        />
                      ) : (
                        <div className="w-full" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500 leading-none">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
