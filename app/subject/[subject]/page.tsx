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

const ABITUSS_TYPES = ['MC', 'TBS']

export default function TypeSelectPage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const isReg = subject === 'REG'
  const isRegSub = subject === 'REG1' || subject === 'REG2'
  const backHref = isRegSub ? '/subject/REG' : '/subject'

  const [code, setCode] = useState<string | null>(null)
  const [typeCounts, setTypeCounts] = useState<Record<string, { total: number; maru: number; sankaku: number; batsu: number }>>({})
  const [regSubSelect, setRegSubSelect] = useState<string | null>(null)

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
    const subjectsToQuery = isReg ? ['REG', 'REG1', 'REG2'] : [subject]
    const { data } = await supabase
      .from('results')
      .select('type, rating')
      .eq('code', inviteCode)
      .in('subject', subjectsToQuery)

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

  function handleTypeClick(typeId: string) {
    if (isReg && ABITUSS_TYPES.includes(typeId)) {
      setRegSubSelect(typeId)
    } else {
      router.push(`/subject/${subject}/${typeId}`)
    }
  }

  if (!code) return null

  const displayTypes = isRegSub ? TYPES.filter(t => ABITUSS_TYPES.includes(t.id)) : TYPES

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href={backHref} className="p-2 text-slate-500">
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
          {displayTypes.map(type => {
            const counts = typeCounts[type.id]
            const isAbitussForReg = isReg && ABITUSS_TYPES.includes(type.id)

            return (
              <button
                key={type.id}
                onClick={() => handleTypeClick(type.id)}
                className="w-full text-left block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">{type.label}</span>
                    <p className="text-slate-500 text-sm mt-1">{type.desc}</p>
                    {isAbitussForReg && (
                      <p className="text-xs text-blue-400 mt-0.5">REG1 / REG2 を選択</p>
                    )}
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
              </button>
            )
          })}
        </div>
      </div>

      {/* REG1 / REG2 選択モーダル */}
      {regSubSelect && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 pb-0">
          <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-xl pb-safe">
            <div className="px-5 pt-5 pb-2">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-800 text-center mb-1">分冊を選択</h2>
              <p className="text-xs text-slate-400 text-center mb-4">
                {regSubSelect}（アビタス）の分冊を選んでください
              </p>
            </div>
            <div className="px-4 space-y-3 pb-3">
              <button
                onClick={() => router.push(`/subject/REG1/${regSubSelect}`)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-blue-50 rounded-xl text-left active:bg-blue-100 transition-colors border border-blue-100"
              >
                <span className="text-xl font-bold text-blue-600">REG2</span>
                <span className="text-slate-600 text-sm">商法</span>
              </button>
              <button
                onClick={() => router.push(`/subject/REG2/${regSubSelect}`)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-blue-50 rounded-xl text-left active:bg-blue-100 transition-colors border border-blue-100"
              >
                <span className="text-xl font-bold text-blue-600">REG1</span>
                <span className="text-slate-600 text-sm">税法</span>
              </button>
            </div>
            <div className="px-4 pb-6">
              <button
                onClick={() => setRegSubSelect(null)}
                className="w-full py-3 text-slate-400 text-sm font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
