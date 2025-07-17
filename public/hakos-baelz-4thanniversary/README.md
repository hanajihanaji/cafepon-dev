# Hakos Baelz 4th Anniversary Cheering Cafe Project

## ファイル構成

- `index.html` - 本番環境・ローカル環境共通（絶対パス）

## ローカル環境セットアップ

ローカルでも絶対パスが動作するよう、シンボリックリンクを作成：

```bash
sudo ln -sf /home/hamauchi/cafepon-dev/public/hakos-baelz-4thanniversary /hakos-baelz-4thanniversary
```

## 使用方法

### 本番環境・ローカル環境共通
- `index.html` を使用
- 絶対パス (`/hakos-baelz-4thanniversary/`) で設定済み
- 両環境で同じファイルが正常に動作

## 開発ワークフロー

1. **開発・テスト**: `index.html` でローカルテスト
2. **デプロイ**: そのまま本番サーバーにデプロイ

シンボリックリンクにより、パスの切り替え作業が完全に不要になります。