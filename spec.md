プロジェクト概要
	•	名称：ブラウザ版オセロ（Othello/Reversi）
	•	目的：スマホ・iPad対応のオセロゲームを、HTML/CSS/JavaScriptのみで実装し、GitHub Pages で公開・プレイ可能にする。
	•	想定利用者：カジュアルユーザー、学習目的の開発者
	•	非機能要求の優先度：操作性 > 安定性 > パフォーマンス > 視認性 > 拡張性

⸻

スコープ
	•	MVP（必須）
	•	8×8 盤の対人（ローカル）対戦
	•	合法手の判定・石の反転・ゲーム終了・スコア算出
	•	合法手がない場合は自動でパス。その際にポップアップで通知（直近の手番・残り合法手0の旨）。
	•	ターン表示、合法手ハイライト（ON/OFF 切替）
	•	手戻し（アンドゥ）は直前の1手のみ
	•	新規ゲーム開始（初期配置/任意先手）。ゲーム終了後は結果ポップアップ（勝敗、手数、石の内訳、［新規ゲーム］ボタン）
	•	盤のサイズ固定（8×8）
	•	対応端末：スマホ（iOS/Android）と iPad（タブレット）。縦横両対応・スクロールなしで収まるコンパクトデザイン
	•	GitHub Pages でのホスティング（静的サイト）
	•	初回リリース後の拡張（バックログ）
	•	CPU 対戦（1 レベル以上）
	•	着手候補の評価スコア表示（簡易）
	•	ローカル保存（直近ゲーム再開、設定保存）
	•	PWA 対応（オフライン動作）
	•	マルチテーマ（ライト/ダーク/高コントラスト）
	•	盤のサイズ拡張（10×10 など）。UI・ロジック双方の対応可否を検討

⸻

技術要件
	•	スタック：HTML5、CSS3、Vanilla JavaScript（ES2020 以降）
	•	ビルド：不要（素の JS/CSS/HTML）。Node 等の依存を持たない。
	•	互換ブラウザ：Safari/Chrome/Firefox/Edge の最新 2 メジャー
	•	リポジトリ：GitHub
	•	公開：GitHub Pages（main ブランチの / 直下 or docs/）

ディレクトリ構成（提案）

/
├─ index.html
├─ assets/
│  ├─ icons/
│  └─ sounds/
├─ styles/
│  └─ style.css
├─ scripts/
│  ├─ game.js        // ルール・盤面・合法手判定・反転
│  ├─ ui.js          // DOM描画・入力・アニメーション・ポップアップ
│  ├─ state.js       // 状態管理・履歴（undo: 1 手）
│  └─ storage.js     // 設定/セーブ（初期はスタブ）
└─ README.md


⸻

ゲーム仕様

盤・座標
	•	8×8、初期配置：中央 4 マスに白黒 2 ずつ、対角配置
	•	座標系：row: 0..7, col: 0..7（内部表現）

手番・石色
	•	黒先手/白先手は設定で選択（デフォルト：黒）
	•	ターン表示（UI 上に現在手番を明示）

合法手判定
	•	対象マスが空であること
	•	8 方向のいずれかで「自分の石に挟める」連続した相手石が 1 個以上あること
	•	合法手が 0 の場合は自動パス。パス通知ポップアップを表示（閉じる/OKで次の手番へ）。連続パスで終了

反転処理
	•	着手マスから 8 方向へ探索し、相手石連続列の後ろに自分石がある方向を反転

終了条件
	•	双方が打てない（連続パス）または盤が埋まる
	•	スコア：黒/白の石数カウント。勝敗/引き分け表示
	•	結果ポップアップ：勝敗（Win/Lose/Draw）、総手数、黒/白の最終石数、［新規ゲーム］ボタン

アンドゥ
	•	直前の1手のみ可能（以降の履歴は破棄）

⸻

UI/UX 要件

画面構成（単一ページ）
	1.	ヘッダー：ゲームタイトル、現在手番、スコア
	2.	ボード：正方形 8×8 グリッド
	3.	操作バー：
	•	新規ゲーム
	•	先手切替（黒/白）
	•	合法手ハイライト ON/OFF
	•	アンドゥ（直前 1 手）
	4.	フッター：著作権表示、バージョン
	5.	ポップアップ：
	•	パス通知：文言「合法手がないため自動でパスしました（◯◯の手番へ）」
	•	結果：勝敗/手数/石の内訳 + ［新規ゲーム］

インタラクション
	•	タップ/クリックで着手
	•	非合法手：軽いバイブ or セルのシェイク
	•	合法手：反転アニメ（0.15–0.25s/方向）
	•	合法手ハイライト：点灯/ドット表示

レイアウト/レスポンシブ
	•	縦横対応：最短辺に合わせた正方形ボード。余白にコントロール
	•	コンパクトデザイン：スクロールなしで画面に収める（ヘッダー・操作バーは 2 行までに抑制）
	•	ブレークポイント：
	•	~480px（スマホ縦）：操作バーはボード下に縦積み（アイコン+短文）
	•	481–1024px（スマホ横/タブ）：ボード右に操作バー横並び
	•	1025px~（PC/タブ横）：中央寄せ
	•	タップ領域：最小 44×44 CSS px

視認性・テーマ
	•	コントラスト比 WCAG AA 以上
	•	石は黒/白の輪郭線で視認性確保

アクセシビリティ（MVP）
	•	フォーカスリング可視
	•	キーボード操作（PC）：矢印移動 + Enter 決定（任意）
	•	ARIA：ボード=grid、セル=gridcell（座標/状態ラベル）

⸻

状態管理・データモデル

// 例：内部状態（JS）
interface Cell { // 0:空, 1:黒, 2:白
  v: 0 | 1 | 2;
}
interface MoveRecord {
  player: 1 | 2;
  pos: { r: number; c: number } | null; // パスは null
  flipped: { r: number; c: number }[];
  scoreAfter: { black: number; white: number };
}
interface GameState {
  board: Cell[][];       // 8x8
  turn: 1 | 2;           // 1:黒, 2:白
  legalMoves: { r: number; c: number }[];
  lastMove: MoveRecord | null; // アンドゥ1手だけ保持
  settings: {
    blackFirst: boolean;
    showHints: boolean;
  };
  popup: { type: 'none'|'pass'|'result'; payload?: any };
  over: boolean;
}


⸻

主要ロジック（擬似コード）

合法手探索

function findLegalMoves(board, player): positions[]
  positions = []
  for each empty cell (r,c):
    if capturesAny(board, r, c, player): positions.push({r,c})
  return positions

自動パス

if legalMoves.length == 0:
  showPopup('pass', { next: opponent(player) })
  record lastMove as pass
  switch turn; recompute legal moves
  if next legalMoves == 0: endGame()

着手と反転

function applyMove(state, pos): state'
  flipped = collectFlipped(board, pos, player)
  place stone; flip all flipped
  update score; set lastMove
  switch turn; compute legal moves; if 0 -> auto-pass
  if both 0 -> endGame()

アンドゥ（1手）

undo():
  if lastMove == null: return
  revert board with lastMove
  restore turn & score
  lastMove = null

結果ポップアップ

endGame():
  calc score; decide winner/draw
  showPopup('result', { winner, moves, score })


⸻

非機能要件
	•	パフォーマンス：
	•	初期描画 < 1s（中程度端末）
	•	タップから反転完了まで < 200ms + アニメ時間
	•	サイズ目安：総アセット < 200KB（初期）。画像は極力 CSS/SVG 化
	•	エラーハンドリング：想定外入力は無視。例外は console.error

⸻

テスト観点（受け入れ基準）
	1.	初期配置が正しい（黒白 2 ずつ対角）
	2.	合法手で正しく反転（8 方向、境界/角ケース）
	3.	合法手ゼロで自動パスし、パス通知ポップアップが表示される
	4.	連続パスで終了し、結果ポップアップに勝敗/手数/石内訳が表示され、［新規ゲーム］で再開できる
	5.	**アンドゥ（1手）**が正しく機能（2回目のアンドゥ不可）
	6.	スマホ/タブ縦横でボードが正方形を維持し、スクロールなしで収まる
	7.	合法手ハイライト ON/OFF が切り替わる
	8.	同一セル多重タップで不正着手が発生しない
	9.	GitHub Pages で問題なく動作し、相対パスでアセット解決

⸻

デプロイ手順（GitHub Pages）
	•	リポジトリ作成 → index.html をルートに置く
	•	リポジトリ設定 → Pages → main// または docs/ を選択
	•	反映後、公開 URL で動作確認

⸻

参考 UI ワイヤ（テキスト）

+--------------------------------------------------+
| Othello (黒の手番 ●)           [新規] [UNDO]     |
| スコア: 黒 2  -  白 2              [ハイライト ☐] |
+----------------------+---------------------------+
|  8x8 Board (正方形) | 先手: (●黒 / ○白)         |
+----------------------+---------------------------+
| © 2025  Version 1.0                              |
+--------------------------------------------------+

[パス通知ポップアップ]
合法手がないため自動でパスしました → 次は白の手番
[OK]

[結果ポップアップ]
黒 34 - 30 白  （Winner: 黒）
手数: 52
[新規ゲーム]


⸻

今後の拡張（バックログ詳細）
	•	CPU 対戦：
	•	レベル1：合法手からランダム
	•	レベル2：角/辺優先のヒューリスティック
	•	保存：localStorage に履歴/設定/最終局面
	•	PWA：Manifest/Service Worker（静的キャッシュ）
	•	テーマ：CSS 変数ベースで切替
	•	解析：リプレイ/棋譜（座標表記）エクスポート
	•	可変盤サイズ：10×10 等の拡張時はボード生成・勝敗条件・レイアウトを自動対応

⸻

定義と用語
	•	合法手：置いたときに 8 方向のいずれかで相手石を 1 つ以上挟める手
	•	パス：合法手が 0 のため着手できない状態（手動操作は無し）
	•	連続パス：両者連続でパス。ゲーム終了

⸻

完了の定義（DoD）
	•	受け入れ基準 1–9 を満たす
	•	README にプレイ方法/操作説明/互換ブラウザ/ライセンス記載
	•	GitHub Pages に公開され、スマホ/iPad での手動テスト完了
