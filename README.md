# projects

X（Twitter）自動化ツールの開発・運用と個人ブログ管理のワークスペース。
Claude Codeを最大限に活用するための設定・ルール・スキルを管理しています。

## 構成

```
.claude/
├── rules/       # セキュリティ・運用ルール
├── skills/      # 再利用可能なスキル
├── commands/    # カスタムスラッシュコマンド（/plan, /review）
└── agents/      # サブエージェント（reviewer など）
repositories/    # 各プロジェクト（Gitリポジトリ）
documents/       # ドキュメント・メモ
tasks/           # スケジュール実行タスク定義
```

## 主なリポジトリ

| リポジトリ | 説明 |
|---|---|
| [blog](repositories/blog) | Next.js + MDX 個人ブログ |

## カスタムコマンド

| コマンド | 説明 |
|---|---|
| `/plan` | 実装前の設計整理 |
| `/review` | コード・スクリプトレビュー |
| `/commit-message` | コミットメッセージ生成 |
| `/pr-description` | PR説明文生成 |
