import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Rating = '○' | '△' | '×'

export interface InviteCode {
  code: string
  subject: string
  created_at: string
}

export interface Question {
  id: string
  subject: string
  type: string
  question_no: string
  title: string
  sort_order: number
}

export interface Result {
  id: string
  code: string
  subject: string
  type: string
  question_no: string
  title: string
  round: number
  rating: Rating
  reason: string | null
  memo: string
  answered_at: string
  created_at: string
}

export const REASON_OPTIONS = [
  '論点を知らなかった',
  '知っていたが適用を間違えた',
  '計算ミス',
  '問題文の読み間違い',
  '勘での正解',
] as const

export type Reason = typeof REASON_OPTIONS[number]
