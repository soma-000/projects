# CLAUDE.md

このファイルはClaude Codeがこのワークスペースで作業する際のガイドラインです。

## ワークスペース構成

```
projects/
├── .claude/
│   ├── rules/       # コーディング規約・セキュリティルール
│   ├── skills/      # 再利用可能なスキル定義
│   ├── commands/    # カスタムスラッシュコマンド
│   ├── agents/      # サブエージェント定義
│   ├── hooks/       # 自動ガードレール
│   └── memory/      # 長期記憶
├── .github/
│   └── workflows/   # GitHub Actions
├── documents/       # コード以外のドキュメント（仕様書、メモ、記事ネタなど）
├── repositories/    # Gitで管理するプロジェクト（コード）
├── tasks/           # Claudeへの依頼プロンプトやスケジュール実行の定義ファイル
├── CLAUDE.md        # このファイル（全体ルール）
└── CLAUDE.local.md  # ローカル専用設定（.gitignore対象）
```

## リポジトリ一覧

- `repositories/blog` — Next.js + MDX で作った個人ブログ

## 開発ワークフロー

**Plan → Code → Review → Test の順で必ず進める。**

1. **Plan**: `/plan` コマンドで設計を整理してから実装開始
2. **Code**: 小さな単位で実装。1PRに1つの目的
3. **Review**: `/review` コマンドで自己レビュー
4. **Test**: 実装と同時にテストを書く（後回し禁止）

## スキル・コマンド一覧

| コマンド | 用途 |
|---|---|
| `/commit-message` | コミットメッセージを生成する |
| `/pr-description` | PRの説明文を生成する |
| `/plan` | 実装前の設計・影響範囲整理 |
| `/review` | コードレビュー（品質・セキュリティ・テスト） |
| `/fix` | バグ修正の依頼テンプレート |
| `/ship` | リリース前チェックリスト |

## コーディング規約

詳細は `.claude/rules/coding.md` を参照。

- 命名: 変数`camelCase` / クラス`PascalCase` / 定数`UPPER_SNAKE_CASE`
- 関数は1責務、引数3つ以内
- コメントは「なぜ」を書く

## セキュリティ

詳細は `.claude/rules/security.md` を参照。

- シークレットは絶対にコミットしない
- ユーザー入力は必ずバリデーション
- `npm audit` を定期実行

## Claude Codeを使う上でのルール

- 複雑なタスクは必ず `/plan` で設計してから実装する
- 1回のプロンプトで1つの目的に絞る
- 実装後は必ず `/review` で品質確認する
- 求められていないファイル・機能を勝手に追加しない
- 推測で複数箇所を一度に変更しない

## blog の開発

```bash
cd repositories/blog
npm run dev    # 開発サーバー起動 → http://localhost:3000
npm run build  # ビルド確認
```

記事は `repositories/blog/posts/` に Markdown ファイルを追加するだけで公開される。
