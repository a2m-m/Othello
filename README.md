# Othello (Reversi)

純粋な HTML / CSS / JavaScript だけで構築したシンプルなオセロ（リバーシ）ゲームです。追加のビルドや開発サーバーを起動する必要がなく、`index.html` をブラウザで開くだけですぐにプレイできます。スマートフォン・タブレット・デスクトップのいずれでも快適に操作できるようレスポンシブとアクセシビリティを重視しています。

## プロジェクト概要
- 8×8 盤でのローカル対戦をサポートします（黒/白の先手切り替え対応）。
- 合法手ハイライト、アンドゥ（直前 1 手）、自動パス通知、結果ダイアログなど基本的な対局フローを完備しています。
- 状態管理と盤面ロジックは純粋関数で実装され、UI と疎結合な構成です。
- GitHub Pages でのホスティングを前提とした静的サイト構成ですべてのリソースを相対パスで読み込みます。

## クイックスタート（セットアップ不要）
1. このリポジトリをダウンロードまたはクローンします。
2. `index.html` を任意のモダンブラウザで直接開きます（`file://` での閲覧可）。
3. そのままブラウザ上でゲームをプレイできます。

> 開発サーバーやパッケージマネージャーは不要です。ファイルを GitHub Pages などの静的ホスティングに配置すれば同じ構成で動作します。

## 操作ガイド
- **石を置く**: セルをタップ / クリック / フォーカスして Enter または Space を押します。
- **合法手ハイライト**: 操作バーの「ハイライト切替」で合法手候補の表示を ON/OFF できます。
- **アンドゥ**: 直前 1 手のみ取り消せます。パスした手番も履歴に記録されます。
- **先手切替 / 新規ゲーム**: 操作バーから任意のタイミングで初期配置へ戻れます。
- **キーボード操作**: 矢印キーでフォーカスセルを移動し、Enter/Space で着手できます。
- **アクセシビリティ通知**: 手番変更・パス・対局結果を `aria-live` 領域で読み上げます。

## 主な機能
- 盤面ロジック：合法手探索、石の反転、スコア計算、終局判定を純粋関数で提供。
- 状態管理：履歴（アンドゥ）、連続パス判定、設定保持を一元管理するコントローラーを実装。
- UI：8×8 グリッドを自動生成し、デバイス幅に応じてレイアウトが切り替わるレスポンシブデザイン。
- アクセシビリティ：ARIA 属性の付与、フォーカスリング強調、`aria-live` 通知でスクリーンリーダーをサポート。

## 動作環境
- 対応ブラウザ：Safari / Chrome / Firefox / Edge の最新 2 メジャーバージョン。
- 推奨デバイス：スマートフォン（縦横）、タブレット、デスクトップ。
- JavaScript が有効な環境でご利用ください。

## GitHub Pages デプロイ手順
1. リポジトリのルートにあるファイル一式（`index.html`、`404.html`、`assets/`、`scripts/`、`styles/`、`docs/` など）をコミットし、`main` ブランチへプッシュします。
2. GitHub の **Settings → Pages** を開き、**Source** を `Deploy from a branch`、**Branch** を `main`、**Folder** を `/ (root)` に設定します。
3. 保存後、GitHub がビルドを開始します。デプロイ完了通知（メールまたは GitHub の通知）を受け取るまで待ちます。
4. 公開 URL（例: `https://<GitHub ユーザー名>.github.io/<リポジトリ名>/`）にアクセスしてトップページが表示されることを確認します。
5. 未知のパス（例: `/unknown`）へアクセスし、`404.html` のリダイレクトでトップページへ戻れるかを検証します。
6. 公開後は `docs/deploy-checklist.md` を参照し、手動テストやアクセシビリティ確認を実施してください。

## 付属ドキュメント
- [`docs/deploy-checklist.md`](./docs/deploy-checklist.md): GitHub Pages 公開前後に実施するチェックリスト。
- [`spec.md`](./spec.md): 企画・要件定義ドキュメント。
- [`task.md`](./task.md): タスク一覧。

## パフォーマンス計測 (Lighthouse)
2025-09-19 にデスクトップ Chrome の Lighthouse (Performance モード) で測定した値です。

| 指標 | 測定値 | 備考 |
| --- | --- | --- |
| Performance Score | 100 | 初期ロードのみ、ネットワーク遅延なし |
| Largest Contentful Paint | 0.8 s | 盤面描画時 |
| Total Blocking Time | 0 ms | 同期処理が短いためブロッキングなし |
| Cumulative Layout Shift | 0.00 | レイアウトシフトなし |

## 受け入れ基準チェックリスト (最終確認日: 2025-09-19)
- [x] 1. 初期配置が正しく黒白 2 個ずつ対角に配置されること。
- [x] 2. 合法手で正しく石が反転し、角や辺のケースも想定通りに動作すること。
- [x] 3. 合法手が 0 の場合に自動パスし、パス通知ダイアログが表示されること。
- [x] 4. 連続パスで対局が終了し、結果ダイアログに勝敗 / 手数 / 石数が表示され、新規ゲームで再開できること。
- [x] 5. アンドゥが直前 1 手のみ可能で、2 回目以降は受け付けないこと。
- [x] 6. スマホ・タブレット縦横でボードが正方形を維持し、スクロールなしで収まること。
- [x] 7. 合法手ハイライトの ON/OFF が切り替わり、表示状態が即時反映されること。
- [x] 8. 同一セルの多重タップや無効入力で不正着が発生しないこと。

## ディレクトリ構成
```
/
├─ index.html
├─ 404.html
├─ assets/
├─ docs/
│  └─ deploy-checklist.md
├─ scripts/
│  ├─ game.js
│  ├─ state.js
│  ├─ ui.js
│  └─ main.js
├─ styles/
│  └─ style.css
├─ README.md
├─ spec.md
└─ task.md
```

## ライセンス
MIT License

Copyright (c) 2024 Othello Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
