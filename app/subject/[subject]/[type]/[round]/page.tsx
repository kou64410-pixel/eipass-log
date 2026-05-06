'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Rating, type Question, type Result, REASON_OPTIONS } from '@/lib/supabase'
import type { Bookmark } from '@/lib/supabase'

type QuestionWithResult = Question & {
  result?: Result
  pendingRating?: Rating
  pendingReason?: string | null
  pendingMemo?: string
  pendingDate?: string
  saving?: boolean
  saved?: boolean
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

// ×理由ポップアップ
function ReasonPopup({
  onSelect,
  onSkip,
}: {
  onSelect: (reason: string) => void
  onSkip: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 pb-0">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-xl pb-safe">
        <div className="px-5 pt-5 pb-2">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 text-center mb-1">なぜ×でしたか？</h2>
          <p className="text-xs text-slate-400 text-center mb-4">理由を選択してください（任意）</p>
        </div>
        <div className="px-4 space-y-2 pb-3">
          {REASON_OPTIONS.map((reason, i) => (
            <button
              key={reason}
              onClick={() => onSelect(reason)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-50 rounded-xl text-left active:bg-red-50 transition-colors"
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs shrink-0">
                {i + 1}
              </span>
              <span className="text-slate-700 font-medium text-sm">{reason}</span>
            </button>
          ))}
        </div>
        <div className="px-4 pb-6">
          <button
            onClick={onSkip}
            className="w-full py-3 text-slate-400 text-sm font-medium"
          >
            スキップ
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuestionListPage() {
  const router = useRouter()
  const params = useParams()
  const subject = params.subject as string
  const type = params.type as string
  const round = Number(params.round)

  const [code, setCode] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionWithResult[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [prevRatings, setPrevRatings] = useState<Map<string, string>>(new Map())

  // フィルター
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [filterUnanswered, setFilterUnanswered] = useState(false)
  const [filterPrevBatsu, setFilterPrevBatsu] = useState(false)
  const [filterBookmark, setFilterBookmark] = useState(false)

  // ブックマーク
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())

  // ×理由ポップアップ
  const [reasonPopupId, setReasonPopupId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async (inviteCode: string) => {
    setLoading(true)

    const { data: allQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', subject)
      .eq('type', type)
      .order('sort_order')

    if (!allQuestions) { setLoading(false); return }

    const { data: currentResults } = await supabase
      .from('results')
      .select('*')
      .eq('code', inviteCode)
      .eq('subject', subject)
      .eq('type', type)
      .eq('round', round)

    let filteredQuestions = allQuestions
    const newPrevRatings = new Map<string, string>()

    if (round > 1) {
      const { data: prevResults } = await supabase
        .from('results')
        .select('question_no, rating')
        .eq('code', inviteCode)
        .eq('subject', subject)
        .eq('type', type)
        .eq('round', round - 1)

      if (prevResults) {
        const retryNos = new Set<string>()
        for (const r of prevResults) {
          newPrevRatings.set(r.question_no, r.rating)
          if (r.rating === '△' || r.rating === '×') retryNos.add(r.question_no)
        }
        filteredQuestions = allQuestions.filter(q => retryNos.has(q.question_no))
      }
    }
    setPrevRatings(newPrevRatings)

    const resultMap = new Map<string, Result>()
    if (currentResults) {
      for (const r of currentResults) resultMap.set(r.question_no, r)
    }

    setQuestions(filteredQuestions.map(q => ({
      ...q,
      result: resultMap.get(q.question_no),
      pendingRating: resultMap.get(q.question_no)?.rating,
      pendingReason: resultMap.get(q.question_no)?.reason ?? null,
      pendingMemo: resultMap.get(q.question_no)?.memo || '',
      pendingDate: resultMap.get(q.question_no)?.answered_at || today,
    })))

    const { data: bookmarkData } = await supabase
      .from('bookmarks')
      .select('question_no')
      .eq('code', inviteCode)
      .eq('subject', subject)
      .eq('type', type)

    if (bookmarkData) {
      setBookmarks(new Set(bookmarkData.map((b: Pick<Bookmark, 'question_no'>) => b.question_no)))
    }

    setLoading(false)
  }, [subject, type, round, today])

  useEffect(() => {
    const saved = localStorage.getItem('eipass_code')
    if (!saved) { router.replace('/'); return }
    setCode(saved)
    loadData(saved)
  }, [router, loadData])

  function updateQuestion(id: string, patch: Partial<QuestionWithResult>) {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))
  }

  async function toggleBookmark(questionNo: string) {
    if (!code) return
    const isBookmarked = bookmarks.has(questionNo)
    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('code', code)
        .eq('subject', subject)
        .eq('type', type)
        .eq('question_no', questionNo)
      setBookmarks(prev => {
        const next = new Set(prev)
        next.delete(questionNo)
        return next
      })
    } else {
      await supabase
        .from('bookmarks')
        .insert({ code, subject, type, question_no: questionNo })
      setBookmarks(prev => new Set(prev).add(questionNo))
    }
  }

  // ×を選択したときにポップアップを表示
  function handleRatingSelect(q: QuestionWithResult, rating: Rating) {
    updateQuestion(q.id, { pendingRating: rating })
    if (rating === '×') {
      setReasonPopupId(q.id)
    } else {
      // ×以外に変更した場合はreasonをクリア
      updateQuestion(q.id, { pendingRating: rating, pendingReason: null })
    }
  }

  function handleReasonSelect(reason: string) {
    if (!reasonPopupId) return
    updateQuestion(reasonPopupId, { pendingReason: reason })
    setReasonPopupId(null)
  }

  function handleReasonSkip() {
    if (!reasonPopupId) return
    updateQuestion(reasonPopupId, { pendingReason: null })
    setReasonPopupId(null)
  }

  async function saveQuestion(q: QuestionWithResult) {
    if (!q.pendingRating || !code) return
    updateQuestion(q.id, { saving: true, saved: false })
    const payload = {
      code, subject, type,
      question_no: q.question_no, title: q.title, round,
      rating: q.pendingRating,
      reason: q.pendingRating === '×' ? (q.pendingReason ?? null) : null,
      memo: q.pendingMemo || '',
      answered_at: q.pendingDate || today,
    }
    if (q.result) {
      await supabase.from('results').update(payload).eq('id', q.result.id)
    } else {
      await supabase.from('results').insert(payload)
    }
    updateQuestion(q.id, { saving: false, saved: true })
    setTimeout(() => updateQuestion(q.id, { saved: false }), 2000)
    loadData(code)
  }

  // 利用可能なChapter一覧
  const chapters = Array.from(
    new Set(questions.map(q => extractChapter(q.question_no)).filter((c): c is number => c !== null))
  ).sort((a, b) => a - b)

  // 表示する問題（フィルター適用）
  const visibleQuestions = questions.filter(q => {
    if (selectedChapter !== null && extractChapter(q.question_no) !== selectedChapter) return false
    if (filterUnanswered && q.result) return false
    if (filterPrevBatsu && prevRatings.get(q.question_no) !== '×') return false
    if (filterBookmark && !bookmarks.has(q.question_no)) return false
    return true
  })

  const savedCount = questions.filter(q => q.result).length

  if (!code) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ×理由ポップアップ */}
      {reasonPopupId && (
        <ReasonPopup
          onSelect={handleReasonSelect}
          onSkip={handleReasonSkip}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/subject/${subject}/${type}`} className="p-1 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-bold text-slate-800">{subject} {type} — {round}周目</h1>
            <p className="text-xs text-slate-500">{savedCount}/{questions.length} 保存済み</p>
          </div>
        </div>

        {/* Chapter filter */}
        {!loading && chapters.length > 0 && (
          <div className="overflow-x-auto scrollbar-hide border-t border-slate-100">
            <div className="flex gap-2 px-4 py-2 w-max">
              <button
                onClick={() => setSelectedChapter(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedChapter === null ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                全て
              </button>
              {chapters.map(ch => (
                <button
                  key={ch}
                  onClick={() => setSelectedChapter(selectedChapter === ch ? null : ch)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedChapter === ch ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Ch{ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter toggles */}
        {!loading && (
          <div className="flex gap-2 px-4 py-2 border-t border-slate-100 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilterUnanswered(v => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filterUnanswered ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              未回答のみ
            </button>
            {round > 1 && (
              <button
                onClick={() => setFilterPrevBatsu(v => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterPrevBatsu ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                前回×のみ
              </button>
            )}
            <button
              onClick={() => setFilterBookmark(v => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filterBookmark ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              ★ブックマーク
            </button>
            <span className="ml-auto text-xs text-slate-400 self-center shrink-0">{visibleQuestions.length}問表示</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">読み込み中...</div>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-slate-500 text-lg">表示する問題がありません</p>
          {round > 1 && <p className="text-slate-400 text-sm mt-2">{round - 1}周目に△・×の問題がありません</p>}
        </div>
      ) : visibleQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-slate-500">条件に一致する問題がありません</p>
          <button
            onClick={() => { setSelectedChapter(null); setFilterUnanswered(false); setFilterPrevBatsu(false); setFilterBookmark(false) }}
            className="mt-3 text-blue-500 text-sm"
          >
            フィルターをリセット
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {visibleQuestions.map(q => {
            const isExpanded = expandedId === q.id
            const currentRating = q.result?.rating || q.pendingRating
            const savedReason = q.result?.reason
            const isUnanswered = !q.result
            const ratingColor = currentRating === '○'
              ? 'border-green-400 bg-green-50'
              : currentRating === '△'
              ? 'border-yellow-400 bg-yellow-50'
              : currentRating === '×'
              ? 'border-red-400 bg-red-50'
              : 'border-slate-200 bg-white'

            return (
              <div key={q.id} className={`rounded-2xl border-2 shadow-sm transition-colors ${ratingColor}`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-slate-500">No.{q.question_no}</span>
                        <button
                          onClick={e => { e.stopPropagation(); toggleBookmark(q.question_no) }}
                          className="text-base leading-none"
                          aria-label={bookmarks.has(q.question_no) ? 'ブックマーク解除' : 'ブックマーク登録'}
                        >
                          {bookmarks.has(q.question_no) ? '★' : '☆'}
                        </button>
                        {isUnanswered && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium leading-none bg-slate-100 text-slate-500">
                            未回答
                          </span>
                        )}
                        {round > 1 && (() => {
                          const prev = prevRatings.get(q.question_no)
                          if (!prev) return null
                          return (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium leading-none ${
                              prev === '×' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              前回{prev}
                            </span>
                          )
                        })()}
                      </div>
                      <p className="text-slate-800 font-medium mt-0.5 leading-snug">{q.title}</p>
                      {/* 保存済みの×理由タグ */}
                      {savedReason && currentRating === '×' && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {savedReason}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {currentRating && (
                        <span className={`text-lg font-bold ${
                          currentRating === '○' ? 'text-green-600' :
                          currentRating === '△' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {currentRating}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-4">
                    {/* Rating buttons */}
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">評価</p>
                      <div className="flex gap-3">
                        {(['○', '△', '×'] as Rating[]).map(r => (
                          <button
                            key={r}
                            onClick={() => handleRatingSelect(q, r)}
                            className={`flex-1 py-3 rounded-xl text-xl font-bold border-2 transition-all ${
                              q.pendingRating === r
                                ? r === '○' ? 'bg-green-500 border-green-500 text-white'
                                  : r === '△' ? 'bg-yellow-400 border-yellow-400 text-white'
                                  : 'bg-red-500 border-red-500 text-white'
                                : r === '○' ? 'border-green-300 text-green-600 bg-white'
                                  : r === '△' ? 'border-yellow-300 text-yellow-500 bg-white'
                                  : 'border-red-300 text-red-500 bg-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      {/* 選択中の×理由（保存前プレビュー） */}
                      {q.pendingRating === '×' && q.pendingReason && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                            {q.pendingReason}
                          </span>
                          <button
                            onClick={() => setReasonPopupId(q.id)}
                            className="text-xs text-slate-400 underline"
                          >
                            変更
                          </button>
                        </div>
                      )}
                      {q.pendingRating === '×' && !q.pendingReason && (
                        <button
                          onClick={() => setReasonPopupId(q.id)}
                          className="mt-2 text-xs text-red-400 underline"
                        >
                          × の理由を選択
                        </button>
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">日付</p>
                      <input
                        type="date"
                        value={q.pendingDate || today}
                        onChange={e => updateQuestion(q.id, { pendingDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Memo */}
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">メモ</p>
                      <textarea
                        value={q.pendingMemo || ''}
                        onChange={e => updateQuestion(q.id, { pendingMemo: e.target.value })}
                        placeholder="メモを入力..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <button
                      onClick={() => saveQuestion(q)}
                      disabled={!q.pendingRating || q.saving}
                      className={`w-full py-3 rounded-xl font-semibold text-base transition-colors ${
                        q.saved
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-600'
                      }`}
                    >
                      {q.saving ? '保存中...' : q.saved ? '保存しました！' : '保存'}
                    </button>
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
