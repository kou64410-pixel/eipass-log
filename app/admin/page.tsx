'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const SUBJECTS = ['FAR', 'BAR', 'REG', 'AUD']

type InviteRow = {
  code: string
  name: string
  subject: string
  created_at: string
}

// ─── ログイン画面 ────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      sessionStorage.setItem('eipass_admin', '1')
      onLogin()
    } else {
      const data = await res.json()
      setError(data.error || 'ログインに失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">管理者ページ</h1>
          <p className="text-slate-500 mt-1 text-sm">EIPASS 招待コード管理</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="管理者パスワード"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="current-password"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-4 bg-blue-500 text-white font-semibold rounded-xl text-base disabled:opacity-50 transition-colors active:bg-blue-600"
            >
              {loading ? '確認中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── 管理画面 ────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'issue' | 'list'>('issue')
  const [codes, setCodes] = useState<InviteRow[]>([])
  const [loadingCodes, setLoadingCodes] = useState(true)

  // 発行フォーム
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('FAR')
  const [code, setCode] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [issueMsg, setIssueMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchCodes = useCallback(async () => {
    setLoadingCodes(true)
    const { data } = await supabase
      .from('invite_codes')
      .select('code, name, subject, created_at')
      .order('created_at', { ascending: false })
    setCodes((data as InviteRow[]) || [])
    setLoadingCodes(false)
  }, [])

  useEffect(() => { fetchCodes() }, [fetchCodes])

  function generateCode() {
    const subjectCodes = codes.filter(c => c.subject === subject)
    const next = String(subjectCodes.length + 1).padStart(3, '0')
    setCode(`EIPASS-${subject}-${next}`)
  }

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    setIssuing(true)
    setIssueMsg(null)

    const { error } = await supabase.from('invite_codes').insert({
      code: code.trim(),
      name: name.trim(),
      subject,
    })

    if (error) {
      setIssueMsg({ type: 'err', text: error.message.includes('duplicate') ? 'そのコードはすでに存在します' : error.message })
    } else {
      setIssueMsg({ type: 'ok', text: `「${code.trim()}」を発行しました` })
      setName('')
      setCode('')
      fetchCodes()
    }
    setIssuing(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">管理者ページ</h1>
          <button
            onClick={onLogout}
            className="text-sm text-slate-400 px-3 py-1.5 rounded-lg bg-slate-100"
          >
            ログアウト
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl mb-4">
          {([['issue', '招待コード発行'], ['list', '受講者一覧']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                tab === key ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 招待コード発行タブ ── */}
        {tab === 'issue' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-slate-700 mb-4">新規コード発行</h2>
              <form onSubmit={handleIssue} className="space-y-3">
                {/* 受講者名 */}
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">受講者名</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="例：山田 太郎"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* 科目 */}
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">科目</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SUBJECTS.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setSubject(s); setCode('') }}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                          subject === s
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-slate-200 text-slate-600 bg-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 招待コード */}
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">招待コード</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder={`例：EIPASS-${subject}-001`}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium whitespace-nowrap active:bg-slate-200"
                    >
                      自動生成
                    </button>
                  </div>
                </div>

                {issueMsg && (
                  <p className={`text-sm font-medium ${issueMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                    {issueMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={issuing || !name.trim() || !code.trim()}
                  className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-xl text-base disabled:opacity-50 transition-colors active:bg-blue-600"
                >
                  {issuing ? '発行中...' : '発行する'}
                </button>
              </form>
            </div>

            {/* 最近発行したコード */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-600">最近発行したコード</h2>
              </div>
              {loadingCodes ? (
                <div className="px-5 py-4 text-slate-400 text-sm">読み込み中...</div>
              ) : codes.length === 0 ? (
                <div className="px-5 py-4 text-slate-400 text-sm">まだコードがありません</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {codes.slice(0, 5).map(row => (
                    <div key={row.code} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 font-mono">{row.code}</p>
                        <p className="text-xs text-slate-500">{row.name || '—'} · {row.subject}</p>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(row.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 受講者一覧タブ ── */}
        {tab === 'list' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600">受講者一覧 ({codes.length}名)</h2>
              <button
                onClick={fetchCodes}
                className="text-xs text-blue-500 px-2 py-1 rounded-lg bg-blue-50"
              >
                更新
              </button>
            </div>
            {loadingCodes ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">読み込み中...</div>
            ) : codes.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">まだ登録がありません</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {codes.map((row, i) => (
                  <div key={row.code} className="px-5 py-3.5 flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {row.name || <span className="text-slate-400 font-normal">名前なし</span>}
                        </p>
                        <span className="text-xs font-bold text-blue-600 shrink-0">{row.subject}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{row.code}</p>
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">
                      {new Date(row.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── メインコンポーネント ────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const ok = sessionStorage.getItem('eipass_admin') === '1'
    setAuthed(ok)
  }, [])

  function handleLogin() { setAuthed(true) }
  function handleLogout() {
    sessionStorage.removeItem('eipass_admin')
    setAuthed(false)
  }

  if (authed === null) return null  // hydration guard

  if (!authed) return <LoginScreen onLogin={handleLogin} />
  return <AdminDashboard onLogout={handleLogout} />
}
