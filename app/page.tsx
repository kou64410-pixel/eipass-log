'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('invite_codes')
      .select('code, subject')
      .eq('code', code.trim())
      .single()

    setLoading(false)

    if (dbError || !data) {
      setError('招待コードが見つかりません')
      return
    }

    localStorage.setItem('eipass_code', data.code)
    router.push('/subject')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">USCPA</h1>
          <p className="text-slate-500 mt-2">演習ログ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">招待コードでログイン</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="招待コードを入力"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-4 bg-blue-500 text-white font-semibold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:bg-blue-600"
            >
              {loading ? '確認中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
