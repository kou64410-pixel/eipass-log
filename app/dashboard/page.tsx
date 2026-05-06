'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const DAY_JP = ['日', '月', '火', '水', '木', '金', '土']
const TOTAL_Q: Record<string, number> = { MC: 639, TBS: 116, 'RQ-MC': 0, 'RQ-TBS': 0 }
const ALL_TYPES = ['MC', 'TBS', 'RQ-MC', 'RQ-TBS'] as const
type AppType = typeof ALL_TYPES[number]
const TYPE_LABELS: Record<AppType, string> = {
  'MC': 'MC（アビタス）',
  'TBS': 'TBS（アビタス）',
  'RQ-MC': 'MC（RQ）',
  'RQ-TBS': 'TBS（RQ）',
}

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

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

type RoundStat = { sankaku: number; batsu: number; total: number; hasData: boolean }

type TypeData = {
  r1Count: number
  maru: number
  sankaku: number
  batsu: number
  chapterDist: { ch: number; sankaku: number; batsu: number }[]
  dailyCounts: { date: string; dayLabel: string; count: number }[]
  roundTrend: RoundStat[]
}

type DashData = Record<string, TypeData>

type GoalFields = {
  round1_date: string
  round2_date: string
  round3_date: string
  mock_exam_date: string
}
type Goals = Record<string, GoalFields>

const emptyGoal = (): GoalFields => ({
  round1_date: '', round2_date: '', round3_date: '', mock_exam_date: '',
})

export default function DashboardPage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<AppType>('MC')
  const [goals, setGoals] = useState<Goals>({ MC: emptyGoal(), TBS: emptyGoal(), 'RQ-MC': emptyGoal(), 'RQ-TBS': emptyGoal() })
  const [goalSaving, setGoalSaving] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('eipass_code')
    if (!saved) { router.replace('/'); return }
    setCode(saved)
    loadAll(saved)
  }, [router])

  async function loadAll(inviteCode: string) {
    await Promise.all([loadData(inviteCode), loadGoals(inviteCode)])
  }

  async function loadGoals(inviteCode: string) {
    const { data: rows } = await supabase
      .from('goals')
      .select('*')
      .eq('code', inviteCode)

    if (rows && rows.length > 0) {
      const newGoals: Goals = { MC: emptyGoal(), TBS: emptyGoal(), 'RQ-MC': emptyGoal(), 'RQ-TBS': emptyGoal() }
      for (const row of rows) {
        const t = row.type || 'MC'
        newGoals[t] = {
          round1_date: row.round1_date || '',
          round2_date: row.round2_date || '',
          round3_date: row.round3_date || '',
          mock_exam_date: row.mock_exam_date || '',
        }
      }
      setGoals(newGoals)
    }
  }

  async function loadData(inviteCode: string) {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]

    const [{ data: allResults }, { data: recentResults }] = await Promise.all([
      supabase.from('results').select('question_no, rating, type, round').eq('code', inviteCode),
      supabase.from('results').select('answered_at, type').eq('code', inviteCode).gte('answered_at', fromDate).lte('answered_at', today),
    ])

    const result: DashData = {}
    for (const type of ALL_TYPES) {
      const dailyCounts: TypeData['dailyCounts'] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        dailyCounts.push({ date: d.toISOString().split('T')[0], dayLabel: DAY_JP[d.getDay()], count: 0 })
      }
      if (recentResults) {
        for (const r of recentResults) {
          if ((r.type || 'MC') !== type) continue
          const idx = dailyCounts.findIndex(d => d.date === r.answered_at)
          if (idx >= 0) dailyCounts[idx].count++
        }
      }

      const r1 = (allResults || []).filter(r => (r.type || 'MC') === type && r.round === 1)
      let maru = 0, sankaku = 0, batsu = 0
      const chMap: Record<number, { sankaku: number; batsu: number }> = {}
      for (const r of r1) {
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
      const chapterDist = Array.from({ length: 21 }, (_, i) => ({
        ch: i + 1, sankaku: chMap[i + 1]?.sankaku ?? 0, batsu: chMap[i + 1]?.batsu ?? 0,
      }))

      const roundTrend: RoundStat[] = [1, 2, 3].map(rnd => {
        const rows = (allResults || []).filter(r => (r.type || 'MC') === type && r.round === rnd)
        if (rows.length === 0) return { sankaku: 0, batsu: 0, total: 0, hasData: false }
        return {
          sankaku: rows.filter(r => r.rating === '△').length,
          batsu: rows.filter(r => r.rating === '×').length,
          total: rows.length,
          hasData: true,
        }
      })

      result[type] = { r1Count: r1.length, maru, sankaku, batsu, chapterDist, dailyCounts, roundTrend }
    }

    setData(result)
    setLoading(false)
  }

  async function saveGoals() {
    if (!code) return
    setGoalSaving(true)
    const goal = goals[activeType]

    const payload = {
      code,
      type: activeType,
      round1_date: goal.round1_date || null,
      round2_date: goal.round2_date || null,
      round3_date: goal.round3_date || null,
      mock_exam_date: goal.mock_exam_date || null,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('goals')
      .select('code')
      .eq('code', code)
      .eq('type', activeType)
      .single()

    if (existing) {
      await supabase.from('goals').update(payload).eq('code', code).eq('type', activeType)
    } else {
      await supabase.from('goals').insert(payload)
    }

    setGoalSaving(false)
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 2000)
  }

  function updateGoal(field: keyof GoalFields, value: string) {
    setGoals(prev => ({
      ...prev,
      [activeType]: { ...prev[activeType], [field]: value },
    }))
  }

  if (!code) return null

  const d = data?.[activeType]
  const totalQ = TOTAL_Q[activeType]
  const hasKnownTotal = totalQ > 0
  const completionPct = d && hasKnownTotal ? Math.min(Math.round((d.r1Count / totalQ) * 100), 100) : 0
  const maxChBar = d ? Math.max(...d.chapterDist.map(c => c.sankaku + c.batsu), 1) : 1
  const maxDay = d ? Math.max(...d.dailyCounts.map(x => x.count), 1) : 1
  const maxRoundBar = d ? Math.max(...d.roundTrend.map(r => r.sankaku + r.batsu), 1) : 1

  const g = goals[activeType]
  const r1Complete = d ? d.r1Count >= totalQ : false
  const r2HasData = d ? d.roundTrend[1].hasData : false

  // Round 1 goal metrics
  const r1Remaining = d ? Math.max(totalQ - d.r1Count, 0) : 0
  const r1Days = daysUntil(g.round1_date)
  const r1Quota = r1Days > 0 && r1Remaining > 0 ? Math.ceil(r1Remaining / r1Days) : null

  // Round 2 goal metrics (△+× from round 1)
  const r2Remaining = d ? d.sankaku + d.batsu : 0
  const r2Days = daysUntil(g.round2_date)
  const r2Quota = r2Days > 0 && r2Remaining > 0 ? Math.ceil(r2Remaining / r2Days) : null

  // Round 3 goal metrics (△+× from round 2)
  const r3Remaining = d ? d.roundTrend[1].sankaku + d.roundTrend[1].batsu : 0
  const r3Days = daysUntil(g.round3_date)
  const r3Quota = r3Days > 0 && r3Remaining > 0 ? Math.ceil(r3Remaining / r3Days) : null

  // Mock exam countdown
  const mockDays = daysUntil(g.mock_exam_date)

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

      {/* 4タブ */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
          {ALL_TYPES.map(type => (
            <button key={type} onClick={() => setActiveType(type)}
              className={`py-2.5 rounded-lg text-xs font-bold transition-colors leading-tight ${
                activeType === type ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">読み込み中...</div>
        </div>
      ) : d && (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

          {/* 目標設定 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-700">目標設定</h2>
              <span className="text-xs text-slate-400">{activeType}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {/* 模擬試験日 */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">模擬試験日</p>
                  <input
                    type="date"
                    value={g.mock_exam_date}
                    onChange={e => updateGoal('mock_exam_date', e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {g.mock_exam_date && (
                  <div className={`mt-2 text-center py-3 rounded-xl ${
                    mockDays > 0 ? 'bg-blue-50' : mockDays === 0 ? 'bg-orange-50' : 'bg-slate-50'
                  }`}>
                    {mockDays > 0 ? (
                      <>
                        <p className="text-3xl font-bold text-blue-600">{mockDays}<span className="text-base ml-1">日</span></p>
                        <p className="text-xs text-blue-400 mt-0.5">試験まで</p>
                      </>
                    ) : mockDays === 0 ? (
                      <p className="text-base font-bold text-orange-500">本日が試験日です！</p>
                    ) : (
                      <p className="text-sm text-slate-400">試験日が過ぎています</p>
                    )}
                  </div>
                )}
              </div>

              {/* 1周目目標日 */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">1周目 完了目標日</p>
                  <input
                    type="date"
                    value={g.round1_date}
                    onChange={e => updateGoal('round1_date', e.target.value)}
                    className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {g.round1_date && r1Days > 0 && (
                  <div className="mt-2 bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-slate-700">{r1Days}</p>
                      <p className="text-xs text-slate-400">残り日数</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-700">{r1Remaining}</p>
                      <p className="text-xs text-slate-400">残り問題数</p>
                    </div>
                    <div>
                      {r1Quota !== null ? (
                        <>
                          <p className="text-lg font-bold text-blue-600">{r1Quota}</p>
                          <p className="text-xs text-slate-400">1日のノルマ</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-green-600">✓</p>
                          <p className="text-xs text-slate-400">完了済み</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {g.round1_date && r1Days <= 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    {r1Days === 0 ? '本日が目標日です' : '目標日が過ぎています'}
                  </p>
                )}
              </div>

              {/* 2周目目標日 */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">2周目 完了目標日</p>
                  {r1Complete ? (
                    <input
                      type="date"
                      value={g.round2_date}
                      onChange={e => updateGoal('round2_date', e.target.value)}
                      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">未設定</span>
                  )}
                </div>
                {!r1Complete ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">1周目完了後に表示</p>
                ) : g.round2_date && r2Days > 0 ? (
                  <div className="mt-2 bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-slate-700">{r2Days}</p>
                      <p className="text-xs text-slate-400">残り日数</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-700">{r2Remaining}</p>
                      <p className="text-xs text-slate-400">残り問題数</p>
                    </div>
                    <div>
                      {r2Quota !== null ? (
                        <>
                          <p className="text-lg font-bold text-blue-600">{r2Quota}</p>
                          <p className="text-xs text-slate-400">1日のノルマ</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-green-600">✓</p>
                          <p className="text-xs text-slate-400">完了済み</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* 3周目目標日 */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-600">3周目 完了目標日</p>
                  {r2HasData ? (
                    <input
                      type="date"
                      value={g.round3_date}
                      onChange={e => updateGoal('round3_date', e.target.value)}
                      className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">未設定</span>
                  )}
                </div>
                {!r2HasData ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">2周目完了後に表示</p>
                ) : g.round3_date && r3Days > 0 ? (
                  <div className="mt-2 bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-slate-700">{r3Days}</p>
                      <p className="text-xs text-slate-400">残り日数</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-700">{r3Remaining}</p>
                      <p className="text-xs text-slate-400">残り問題数</p>
                    </div>
                    <div>
                      {r3Quota !== null ? (
                        <>
                          <p className="text-lg font-bold text-blue-600">{r3Quota}</p>
                          <p className="text-xs text-slate-400">1日のノルマ</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-green-600">✓</p>
                          <p className="text-xs text-slate-400">完了済み</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Save button */}
            <div className="px-5 pb-5">
              <button
                onClick={saveGoals}
                disabled={goalSaving}
                className={`w-full py-3 rounded-xl font-semibold text-base transition-colors ${
                  goalSaved
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-blue-500 text-white active:bg-blue-600 disabled:opacity-50'
                }`}
              >
                {goalSaving ? '保存中...' : goalSaved ? '保存しました！' : '目標を保存'}
              </button>
            </div>
          </div>

          {/* 1周目完了率 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">1周目 完了率</h2>
            {hasKnownTotal ? (
              <>
                <p className="text-sm text-slate-500 mb-3">
                  {totalQ}問中{' '}
                  <span className="text-slate-800 font-bold text-base">{d.r1Count}問</span>
                  {' '}完了（<span className="text-blue-600 font-bold">{completionPct}%</span>）
                </p>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                <span className="text-slate-800 font-bold text-base">{d.r1Count}問</span>
                {' '}完了
              </p>
            )}
          </div>

          {/* 理解度の内訳 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">理解度の内訳（1周目）</h2>
            <div className="flex gap-3">
              <div className="flex-1 bg-green-50 rounded-xl p-3 text-center border border-green-100">
                <p className="text-2xl font-bold text-green-600">○</p>
                <p className="text-xl font-bold text-green-700 mt-1">{d.maru}</p>
                <p className="text-xs text-green-600 mt-0.5">理解</p>
              </div>
              <div className="flex-1 bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                <p className="text-2xl font-bold text-yellow-500">△</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">{d.sankaku}</p>
                <p className="text-xs text-yellow-500 mt-0.5">要復習</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-xl p-3 text-center border border-red-100">
                <p className="text-2xl font-bold text-red-500">×</p>
                <p className="text-xl font-bold text-red-600 mt-1">{d.batsu}</p>
                <p className="text-xs text-red-500 mt-0.5">未理解</p>
              </div>
            </div>
          </div>

          {/* 周回別 △×推移 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-4">周回別 △×推移</h2>
            <div className="flex gap-4">
              {d.roundTrend.map((stat, i) => {
                const sankakuH = stat.hasData ? Math.max((stat.sankaku / maxRoundBar) * 80, stat.sankaku > 0 ? 4 : 0) : 0
                const batsuH = stat.hasData ? Math.max((stat.batsu / maxRoundBar) * 80, stat.batsu > 0 ? 4 : 0) : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    {stat.hasData ? (
                      <>
                        <div className="flex gap-1 mb-1">
                          {stat.sankaku > 0 && <span className="text-xs text-yellow-500 font-semibold">{stat.sankaku}</span>}
                          {stat.sankaku > 0 && stat.batsu > 0 && <span className="text-xs text-slate-300">/</span>}
                          {stat.batsu > 0 && <span className="text-xs text-red-500 font-semibold">{stat.batsu}</span>}
                          {stat.sankaku === 0 && stat.batsu === 0 && <span className="text-xs text-green-500 font-semibold">全○</span>}
                        </div>
                        <div className="flex gap-1 items-end" style={{ height: '80px' }}>
                          <div className="w-8 flex items-end justify-center" style={{ height: '80px' }}>
                            {sankakuH > 0 ? <div className="w-full bg-yellow-400 rounded-t-sm" style={{ height: `${sankakuH}px` }} /> : <div className="w-full h-1 bg-slate-100 rounded-sm" />}
                          </div>
                          <div className="w-8 flex items-end justify-center" style={{ height: '80px' }}>
                            {batsuH > 0 ? <div className="w-full bg-red-400 rounded-t-sm" style={{ height: `${batsuH}px` }} /> : <div className="w-full h-1 bg-slate-100 rounded-sm" />}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-end" style={{ height: '100px' }}>
                        <span className="text-xs text-slate-300 font-medium">未実施</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2 font-medium">{i + 1}周目</p>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />△ 要復習</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />× 未理解</span>
            </div>
          </div>

          {/* Chapter別理解度分布 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-4">Chapter別 理解度分布（1周目）</h2>
            <div className="space-y-1.5">
              {d.chapterDist.map(({ ch, sankaku, batsu: b }) => {
                const sankakuW = (sankaku / maxChBar) * 100
                const batsuW = (b / maxChBar) * 100
                const total = sankaku + b
                return (
                  <div key={ch} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-8 shrink-0 text-right font-mono">{ch}</span>
                    <div className="flex-1 flex gap-0.5 h-4 bg-slate-50 rounded-sm overflow-hidden">
                      {sankaku > 0 && <div className="h-full bg-yellow-400 rounded-sm" style={{ width: `${sankakuW}%` }} />}
                      {b > 0 && <div className="h-full bg-red-400 rounded-sm" style={{ width: `${batsuW}%` }} />}
                    </div>
                    <span className="text-xs text-slate-400 w-5 shrink-0 text-right">{total > 0 ? total : ''}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />△ 要復習</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />× 未理解</span>
            </div>
          </div>

          {/* 直近7日間の学習ペース */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-4">直近7日間の学習ペース</h2>
            <div className="flex items-end gap-1.5" style={{ height: '100px' }}>
              {d.dailyCounts.map(({ date, dayLabel, count }) => {
                const barH = count > 0 ? Math.max((count / maxDay) * 72, 4) : 0
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    {count > 0 && <span className="text-xs text-slate-500 leading-none">{count}</span>}
                    <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                      {barH > 0 ? <div className="w-full bg-blue-400 rounded-t-sm" style={{ height: `${barH}px` }} /> : <div className="w-full" />}
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
