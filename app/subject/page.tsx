'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SUBJECTS = [
  { id: 'FAR', label: 'FAR', desc: '財務会計・報告' },
  { id: 'BAR', label: 'BAR', desc: 'ビジネス分析・報告' },
  { id: 'REG', label: 'REG', desc: '税務・規制' },
  { id: 'AUD', label: 'AUD', desc: '監査・証明' },
]

export default function SubjectPage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('eipass_code')
    if (!saved) {
      router.replace('/')
    } else {
      setCode(saved)
    }
  }, [router])

  function handleLogout() {
    localStorage.removeItem('eipass_code')
    router.replace('/')
  }

  if (!code) return null

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">科目選択</h1>
            <p className="text-sm text-slate-500 mt-1">コード: {code}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg font-medium"
          >
            ログアウト
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 text-sm bg-blue-50 text-blue-700 rounded-xl font-medium text-center border border-blue-200"
          >
            ダッシュボード
          </Link>
          <Link
            href="/summary"
            className="px-4 py-2.5 text-sm bg-slate-200 text-slate-700 rounded-xl font-medium text-center"
          >
            進捗
          </Link>
        </div>

        <div className="space-y-3">
          {SUBJECTS.map(subject => (
            <Link
              key={subject.id}
              href={`/subject/${subject.id}`}
              className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-blue-600">{subject.label}</span>
                  <p className="text-slate-500 text-sm mt-1">{subject.desc}</p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
