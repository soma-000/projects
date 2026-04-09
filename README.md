# projects

個人開発ワークスペース。Claude Codeを最大限に活用するための設定・ルール・スキルを管理しています。

## 構成

```
.claude/
├── rules/       # コーディング規約・セキュリティルール
├── skills/      # 再利用可能なスキル
├── commands/    # カスタムスラッシュコマンド（/plan, /review, /fix, /ship）
├── agents/      # サブエージェント（reviewer など）
└── hooks/       # 自動ガードレール
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
| `/review` | コードレビュー |
| `/fix` | バグ修正テンプレート |
| `/ship` | リリース前チェック |
| `/commit-message` | コミットメッセージ生成 |
| `/pr-description` | PR説明文生成 |
