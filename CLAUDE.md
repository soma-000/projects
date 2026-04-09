# CLAUDE.md

このファイルはClaude Codeがこのワークスペースで作業する際のガイドラインです。

## ワークスペース概要

X（Twitter）自動化ツールの開発・運用と、個人ブログの管理を行うワークスペース。

## フォルダ構成

```
projects/
├── .claude/
│   ├── rules/       # セキュリティ・運用ルール
│   ├── skills/      # 再利用可能なスキル定義
│   ├── commands/    # カスタムスラッシュコマンド
│   ├── agents/      # サブエージェント定義
│   ├── hooks/       # 自動ガードレール
│   └── memory/      # 長期記憶
├── .github/
├── documents/       # ドキュメント・メモ・仕様書
├── repositories/    # Gitで管理するプロジェクト
├── tasks/           # スケジュール実行タスク定義
├── CLAUDE.md        # このファイル
└── CLAUDE.local.md  # ローカル専用設定（Git管理外）
```

## リポジトリ一覧

- `repositories/blog` — Next.js + MDX 個人ブログ

## 主な用途

- **X自動化ツール** — 投稿・分析・スクレイピングなどの自動化スクリプト
- **スケジュール実行** — Claude Codeのリモートエージェントで定期タスクを自動化
- **ブログ管理** — 記事の執筆・公開

## スキル・コマンド一覧

| コマンド | 用途 |
|---|---|
| `/commit-message` | コミットメッセージを生成する |
| `/pr-description` | PRの説明文を生成する |
| `/plan` | 実装・作業前の設計・影響範囲整理 |
| `/review` | コード・スクリプトのレビュー |

## セキュリティ

詳細は `.claude/rules/security.md` を参照。

- APIキー・トークンは絶対にコミットしない（X API, GitHub PAT など）
- 認証情報は環境変数か `CLAUDE.local.md` で管理
- 自動化スクリプトはレート制限を考慮する

## Claude Codeを使う上でのルール

- 複雑なタスクは `/plan` で設計してから実装する
- 実装後は `/review` で品質確認する
- 求められていない機能を勝手に追加しない
- スケジュール実行の変更前は必ず動作を確認する

## blog の開発

```bash
cd repositories/blog
npm run dev    # 開発サーバー起動 → http://localhost:3000
npm run build  # ビルド確認
```

記事は `repositories/blog/posts/` に Markdown ファイルを追加するだけで公開される。
