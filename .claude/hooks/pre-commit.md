# Pre-commit ガードレール

コミット前に自動チェックする内容の定義です。

## チェック項目
1. シークレット・APIキーがステージングされていないか
2. `.env` ファイルがステージングされていないか
3. `console.log` のデバッグ出力が残っていないか
4. TODO/FIXME コメントが新たに追加されていないか

## 設定方法（Git hooks）
```bash
# .git/hooks/pre-commit に追加
grep -r "sk-\|api_key\|password\s*=" --include="*.ts" --include="*.js" . \
  && echo "⚠️  シークレットの可能性があるコードが含まれています" && exit 1
```
