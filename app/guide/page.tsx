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

function AreaCard({ area, ratio, title, children, japaneseNote }: {
  area: string
  ratio: string
  title: string
  children: React.ReactNode
  japaneseNote?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
        <span className="font-bold text-slate-800 text-sm">{area}</span>
        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full shrink-0">{ratio}</span>
      </div>
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
        {japaneseNote && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3 text-sm text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">日本人が特に注意すべき点</p>
            {japaneseNote}
          </div>
        )}
      </div>
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

        <Divider />

        {/* FAR Blueprint */}
        <Section title="FARブループリント解説">
          <div className="space-y-6">

            {/* 試験の構成 */}
            <SubSection title="試験の構成">
              <p className="text-sm text-slate-600 leading-relaxed">
                FARはMCQとTBSの2種類の問題で構成されています。スコアの配点はMCQ50%・TBS50%です。
              </p>
            </SubSection>

            {/* 出題エリアと配点 */}
            <SubSection title="出題エリアと配点">
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                3つのAreaがほぼ均等に出題されます。どれか1つを捨てる戦略は通用しません。
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm border-collapse min-w-[360px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Area</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600 whitespace-nowrap">配点</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">概要</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { area: 'Area I', ratio: '30〜40%', desc: 'Financial Reporting', note: '財務諸表を作れる・直せる・見抜ける能力' },
                      { area: 'Area II', ratio: '30〜40%', desc: 'Select Balance Sheet Accounts', note: 'B/Sの各科目を計算できる・仕訳できる能力' },
                      { area: 'Area III', ratio: '25〜35%', desc: 'Select Transactions', note: '特殊取引を正しく処理できる能力' },
                    ].map(row => (
                      <tr key={row.area} className="bg-white">
                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{row.area}</td>
                        <td className="px-4 py-3 text-blue-700 font-bold whitespace-nowrap">{row.ratio}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <p className="font-medium text-slate-700">{row.desc}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{row.note}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            {/* Area I */}
            <AreaCard
              area="Area I"
              ratio="30〜40%"
              title="Financial Reporting"
              japaneseNote={
                <p>NFPと政府会計は日本の会計基準にない概念です。アビタスのCh20・Ch21をしっかり固めてください。</p>
              }
            >
              <p>財務諸表（B/S・P/L・包括利益・株主資本変動計算書・CF計算書）を試算表や証憑から作成・修正・検証する能力が問われます。</p>
              <p>For-Profit企業の財務諸表だけでなく、非営利組織（NFP）と政府会計も出題されます。CF計算書は間接法での作成が必須です。また、連結財務諸表（子会社・非支配持分含む）の調整・消去仕訳も対象です。</p>
            </AreaCard>

            {/* Area II */}
            <AreaCard
              area="Area II"
              ratio="30〜40%"
              title="Select Balance Sheet Accounts"
            >
              <p>B/Sの各科目について「計算→仕訳→照合→差異調査」までできる実務的な能力が問われます。</p>
              <p>対象科目は現金・売掛金（貸倒引当金含む）、棚卸資産（FIFO・LIFO・平均法・LCM）、有形固定資産（取得・減価償却・減損・売却）、投資有価証券（FV・償却原価・持分法）、無形資産、負債（AP・引当金・社債・リース負債）です。</p>
              <p>単純な計算だけでなく、サブレジャーと総勘定元帳の差異を調査するという実務的なスキルが求められます。TBSで出やすいパターンです。</p>
            </AreaCard>

            {/* Area III */}
            <AreaCard
              area="Area III"
              ratio="25〜35%"
              title="Select Transactions"
            >
              <p>特殊な会計処理の知識と計算能力が問われます。</p>
              <p>対象トピックは会計上の変更・誤謬訂正（遡及適用・将来適用の判断）、偶発債務・コミットメント、収益認識（5ステップモデル・NFPの寄付）、税効果会計（一時差異・繰延税金資産負債）、公正価値測定、リース会計（借手側・分類基準・計算）、後発事象です。</p>
              <p>税効果会計とリース会計は計算量が多く、TBSで頻出です。アビタスのCh9（リース）・Ch15（税効果）は最重点エリアです。</p>
            </AreaCard>

            {/* スキルレベルの配分 */}
            <SubSection title="スキルレベルの配分">
              <div className="overflow-x-auto rounded-xl border border-slate-200 mb-3">
                <table className="w-full text-sm border-collapse min-w-[340px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">スキルレベル</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600 whitespace-nowrap">比率</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">内容</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { level: 'Remembering & Understanding', ratio: '5〜15%', desc: '用語・定義・基準を覚えるレベル' },
                      { level: 'Application', ratio: '45〜55%', desc: '仕訳・計算ができるレベル' },
                      { level: 'Analysis', ratio: '35〜45%', desc: '複数の情報を組み合わせて判断できるレベル' },
                    ].map(row => (
                      <tr key={row.level} className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-700 text-xs leading-snug">{row.level}</td>
                        <td className="px-4 py-3 text-blue-700 font-bold whitespace-nowrap">{row.ratio}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs leading-snug">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                約90%は計算・判断・分析が必要です。理解なき暗記では合格できない試験です。
              </p>
            </SubSection>

            {/* 学習への示唆 */}
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 space-y-3">
              <h3 className="text-base font-bold text-green-800">学習への示唆</h3>
              <div className="space-y-2.5 text-sm text-green-900 leading-relaxed">
                <p>3つのAreaは均等に対策してください。どれか1つでも弱いと致命的です。</p>
                <p>NFPと政府会計は日本人が後回しにしがちですが、出題比率が高いので必ず押さえてください。</p>
                <p>Ch9（リース）とCh15（税効果）はTBSで頻出かつ計算量が多いため、最重点エリアとして時間をかけて学習してください。</p>
                <p>暗記より理解を優先してください。約90%が計算・分析問題であるFARでは、理解に基づいた学習が合格への近道です。</p>
              </div>
            </div>

          </div>
        </Section>

        <Divider />

        {/* AUD Blueprint */}
        <Section title="AUDブループリント解説">
          <div className="space-y-6">

            {/* 試験の構成 */}
            <SubSection title="試験の構成">
              <p className="text-sm text-slate-600 leading-relaxed">
                AUDはMCQとTBSの2種類の問題で構成されています。スコアの配点はMCQ50%・TBS50%です。
              </p>
            </SubSection>

            {/* 出題エリアと配点 */}
            <SubSection title="出題エリアと配点">
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                4つのAreaで構成されています。どのAreaも満遍なく対策が必要です。
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm border-collapse min-w-[360px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Area</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600 whitespace-nowrap">配点</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">概要</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { area: 'Area I',   ratio: '15〜25%', desc: 'Ethics, Professional Responsibilities and General Principles', note: '倫理・独立性・職業的責任と監査の基本原則' },
                      { area: 'Area II',  ratio: '25〜35%', desc: 'Assessing Risk and Developing a Planned Response',             note: 'リスク評価と監査計画の立案能力' },
                      { area: 'Area III', ratio: '30〜40%', desc: 'Performing Further Procedures and Obtaining Evidence',         note: '監査手続の実施と証拠収集能力' },
                      { area: 'Area IV',  ratio: '10〜20%', desc: 'Forming Conclusions and Reporting',                           note: '監査報告書の作成と結論形成' },
                    ].map(row => (
                      <tr key={row.area} className="bg-white">
                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{row.area}</td>
                        <td className="px-4 py-3 text-blue-700 font-bold whitespace-nowrap">{row.ratio}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <p className="font-medium text-slate-700">{row.desc}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{row.note}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            {/* スキルレベルの配分 */}
            <SubSection title="スキルレベルの配分">
              <div className="overflow-x-auto rounded-xl border border-slate-200 mb-3">
                <table className="w-full text-sm border-collapse min-w-[340px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">スキルレベル</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600 whitespace-nowrap">比率</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-600">内容</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { level: 'Remembering & Understanding', ratio: '30〜40%', desc: '用語・定義・基準を覚えるレベル' },
                      { level: 'Application',                 ratio: '30〜40%', desc: '実際の監査手続に適用するレベル' },
                      { level: 'Analysis',                    ratio: '15〜25%', desc: '複数情報を組み合わせて判断するレベル' },
                      { level: 'Evaluation',                  ratio: '5〜15%',  desc: '監査意見・結論を判断するレベル' },
                    ].map(row => (
                      <tr key={row.level} className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-700 text-xs leading-snug">{row.level}</td>
                        <td className="px-4 py-3 text-blue-700 font-bold whitespace-nowrap">{row.ratio}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs leading-snug">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                FARと比べてRemembering &amp; Understandingの比率が高いのが特徴です。ただし全体の60〜80%は応用・分析・評価が必要なため、理解に基づいた学習が不可欠です。
              </p>
            </SubSection>

            {/* Area I */}
            <AreaCard
              area="Area I"
              ratio="15〜25%"
              title="Ethics, Professional Responsibilities and General Principles"
              japaneseNote={
                <p>AICPAの倫理規定は細かいルールが多く、独立性の判断基準（Independence）がよく出題されます。アビタスのCh19を重点的に学習してください。</p>
              }
            >
              <p>独立性・倫理規定（AICPAコード・SOX・SEC・PCAOB）、監査契約の前提条件、経営者・ガバナンス機関とのコミュニケーション、品質管理が対象です。</p>
            </AreaCard>

            {/* Area II */}
            <AreaCard
              area="Area II"
              ratio="25〜35%"
              title="Assessing Risk and Developing a Planned Response"
              japaneseNote={
                <p>内部統制の理解はCh6・Ch7の大きな山場です。COSOフレームワークの5つの構成要素を理解した上で、実際の統制テストの手続まで結びつけて学習してください。2026年版ブループリントからITリスク・データ分析（Audit Data Analytics）の比重が高まっています。アビタスのCh17（IT Controls）も重要です。</p>
              }
            >
              <p>監査計画の策定、内部統制の理解（COSO含む）、重要性（Materiality）の設定、不正リスクの評価、監査リスクモデル（固有リスク・統制リスク・発見リスク）が対象です。</p>
            </AreaCard>

            {/* Area III */}
            <AreaCard
              area="Area III"
              ratio="30〜40%"
              title="Performing Further Procedures and Obtaining Evidence"
              japaneseNote={
                <p>Ch9の実証手続は勘定科目ごとに手続が細かく分かれています。なぜその手続を実施するのかという目的と結びつけて理解することが重要です。TBSでの出題が多いため、計算問題だけでなく手続の選択問題にも対応できるようにしてください。</p>
              }
            >
              <p>最も出題比率が高いAreaです。統制テスト・実証手続の設計と実施、確認状・分析的手続・観察など各種監査証拠の収集、勘定科目別の実証手続（売掛金・棚卸・固定資産・負債等）が対象です。</p>
            </AreaCard>

            {/* Area IV */}
            <AreaCard
              area="Area IV"
              ratio="10〜20%"
              title="Forming Conclusions and Reporting"
              japaneseNote={
                <p>出題比率は低いですが、Ch3・Ch4の監査報告書は種類が多く混乱しやすいです。どの状況でどの報告書になるかを整理して覚えてください。</p>
              }
            >
              <p>監査報告書（無限定・限定・否定・免責）の使い分け、証明業務・レビュー・コンパイレーション報告書、後発事象、特別目的フレームワークが対象です。</p>
              <p>EvaluationがAUDで最も多く問われるAreaです。どの状況でどの監査報告書になるかを正確に判断できるレベルまで理解してください。</p>
            </AreaCard>

            {/* 学習への示唆 */}
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 space-y-3">
              <h3 className="text-base font-bold text-green-800">学習への示唆</h3>
              <div className="space-y-2.5 text-sm text-green-900 leading-relaxed">
                <p>Area IIIが最重点エリアです。Ch6〜Ch9で内部統制から実証手続まで一連の流れを理解してください。</p>
                <p>独立性（Ch19）は細かいルールが多いですが、出題頻度が高いので確実に押さえてください。</p>
                <p>監査報告書（Ch3・Ch4）は種類と使い分けを表で整理すると効率的です。</p>
                <p>AUDはFARと違い評価・判断が求められる問題が多いです。単純な暗記では対応できないため、実務的なシナリオを想定しながら学習してください。</p>
              </div>
            </div>

          </div>
        </Section>

      </div>
    </div>
  )
}
