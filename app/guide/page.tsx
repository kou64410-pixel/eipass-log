import Link from 'next/link'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Divider() {
  return <hr className="border-slate-200" />
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-xl px-4 py-3 text-sm text-blue-900 leading-relaxed">
      {children}
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-700 mb-2">{title}</h3>
      {children}
    </div>
  )
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/subject" className="p-1 text-slate-500 active:text-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-bold text-slate-800">使い方ガイド</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* About */}
        <Section title="このアプリについて">
          <p className="text-sm text-slate-600 leading-relaxed">
            このアプリは、USCPAの問題演習を効率的に管理するためのツールです。問題を○△×で仕分けながら周回することで、苦手分野を可視化することができます。苦手をピンポイントでつぶしていきましょう。
          </p>
        </Section>

        <Divider />

        {/* Setup */}
        <Section title="はじめにやること">
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            ダッシュボードの「目標設定」から以下の日付を入力してください。
          </p>
          <ul className="space-y-1.5 mb-3">
            {['1周目完了目標日', '2周目完了目標日', '3周目完了目標日', '模擬試験日'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Point>
            入力すると「1日あたりの目標問題数」が自動で計算されます。毎日のペースの目安として活用してください。
          </Point>
        </Section>

        <Divider />

        {/* Study flow */}
        <Section title="問題演習の進め方">
          <div className="space-y-5">

            <SubSection title="1周目：問題の仕分け">
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                全問を解き、1問ごとに○△×に仕分けます。
              </p>
              <div className="space-y-2">
                {[
                  { mark: '○', color: 'text-green-600 bg-green-50 border-green-200', desc: '完全正解。他人に説明できるレベル。2周目では解きません。' },
                  { mark: '△', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', desc: '正解したが、根拠が曖昧。2周目で再確認します。' },
                  { mark: '×', color: 'text-red-600 bg-red-50 border-red-200', desc: '不正解、または勘での正解。原因分析と、入念な復習が必要です。' },
                ].map(({ mark, color, desc }) => (
                  <div key={mark} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${color}`}>
                    <span className="text-lg font-bold leading-snug shrink-0">{mark}</span>
                    <p className="text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Point>
                  ○は、本試験で出題されたとしても自信を持って正答できるレベルです。回答の際に少しでも曖昧であれば△で。
                </Point>
              </div>
            </SubSection>

            <SubSection title="2周目：再確認＋深堀り">
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                1周目で△・×だった問題だけが自動で表示されます。
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-yellow-600 shrink-0">△</span>
                  <span>解けたら○に、解けなかったら×に変更</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-red-600 shrink-0">×</span>
                  <span>解説を読み込み、関連論点まで深堀り。「なぜ他の選択肢が間違いか」を必ず確認</span>
                </div>
              </div>
            </SubSection>

            <SubSection title="3周目：仕上げ">
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                2周目で△・×だった問題だけが自動で表示されます。
              </p>
              <Point>
                ここで全問○になればオッケーです。ここでも△または×になった問題は、模擬試験（または本試験）までに必ず復習しましょう。
              </Point>
            </SubSection>
          </div>
        </Section>

        <Divider />

        {/* Input method */}
        <Section title="○△×の入力方法">
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            各問題をタップして開き、○△×のボタンを選択して「保存」を押してください。
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            ×を選んだ際は、理由を選択するポップアップが表示されます。
          </p>
          <ul className="space-y-1.5 mb-3">
            {['論点を知らなかった', '知っていたが適用を間違えた', '計算ミス', '問題文の読み間違い', '勘での正解'].map((r, i) => (
              <li key={r} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs shrink-0">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>
          <Point>1タップで選べるので、解いた直後に必ず記録してください。</Point>
        </Section>

        <Divider />

        {/* Dashboard */}
        <Section title="ダッシュボードの見方">
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            ダッシュボードでは以下が確認できます。
          </p>
          <ul className="space-y-2">
            {[
              '1周目完了率：全問題に対して何問記録したか',
              '理解度の内訳：○△×それぞれの件数',
              'Chapter別理解度分布：どのChapterに△・×が集中しているか',
              '周回別△×推移：周回を重ねるごとに△×が減っているかを確認',
              '直近7日間の学習ペース：毎日コンスタントに解けているか',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Divider />

        {/* Useful features */}
        <Section title="便利な機能">
          <div className="space-y-4">

            <SubSection title="Chapter絞り込み">
              <p className="text-sm text-slate-600 leading-relaxed">
                問題リスト画面の上部でChapter番号を選ぶと、そのChapterの問題だけ表示されます。
              </p>
            </SubSection>

            <SubSection title="フィルター機能">
              <div className="space-y-1.5">
                {[
                  { label: '未回答のみ', desc: 'まだ記録していない問題だけ表示' },
                  { label: '前回×のみ', desc: '前の周回で×だった問題だけ表示' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 mt-0.5">{label}</span>
                    <span className="text-slate-600">{desc}</span>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="ブックマーク">
              <p className="text-sm text-slate-600 leading-relaxed">
                気になる問題に☆をつけて後でまとめて確認できます。
              </p>
            </SubSection>

          </div>
        </Section>

      </div>
    </div>
  )
}
