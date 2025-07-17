# Hakos Baelz 4th Anniversary Cheering Cafe Project

## ファイル構成

- `index.html` - 本番環境用（絶対パス）
- `preview.html` - ローカルプレビュー用（相対パス）

## 使用方法

### 本番環境
- `index.html` を使用
- 絶対パス (`/hakos-baelz-4thanniversary/`) で設定済み

### ローカル開発・プレビュー
- `preview.html` を使用
- 相対パスで設定済み
- ローカルサーバーで正常に動作

## 開発ワークフロー

1. **開発時**: `preview.html` でローカルテスト
2. **本番確認**: `index.html` で本番環境テスト
3. **デプロイ**: `index.html` を本番サーバーにデプロイ

これにより、パスの切り替え作業なしで両環境に対応できます。