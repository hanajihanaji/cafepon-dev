# Strapi CMS デプロイガイド

## 🚀 Railway でのデプロイ手順

### 1. Railway アカウント作成
1. [Railway.app](https://railway.app) にアクセス
2. GitHub アカウントでサインアップ
3. 新しいプロジェクト作成

### 2. データベースセットアップ
1. Railway ダッシュボードで「Add Service」
2. 「Database」→「PostgreSQL」を選択
3. データベースが作成されるまで待機

### 3. Strapi アプリケーションデプロイ
1. 「Add Service」→「GitHub Repo」
2. `cafepon-dev/cafepon-cms` フォルダを選択
3. 以下の環境変数を設定：

```bash
# 必須環境変数
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# セキュリティキー（ランダム生成）
APP_KEYS=your-generated-app-keys
API_TOKEN_SALT=your-generated-salt
ADMIN_JWT_SECRET=your-generated-secret
TRANSFER_TOKEN_SALT=your-generated-salt
JWT_SECRET=your-generated-jwt-secret

# データベース（Railwayが自動設定）
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}

# フロントエンド URL
FRONTEND_URL=https://your-app.vercel.app
```

### 4. 環境変数生成方法
```bash
# Node.js で生成
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 5. デプロイ確認
1. Railway でビルドログを確認
2. 生成された URL にアクセス
3. Strapi 管理画面にログイン

## 🔧 他のデプロイオプション

### Heroku
```bash
# Heroku CLI インストール後
heroku create your-strapi-app
heroku addons:create heroku-postgresql:mini
heroku config:set NODE_ENV=production
# 環境変数設定...
git push heroku main
```

### DigitalOcean App Platform
1. GitHub リポジトリ接続
2. Node.js アプリとして設定
3. PostgreSQL データベース追加
4. 環境変数設定

## 📝 デプロイ後の作業

### 1. 管理者アカウント作成
- デプロイされた URL の `/admin` にアクセス
- 初回管理者アカウントを作成

### 2. データ移行
```bash
# ローカルデータのエクスポート
npm run strapi export

# 本番環境でのインポート
npm run strapi import
```

### 3. API トークン作成
1. 管理画面 → Settings → API Tokens
2. 新しいトークンを作成
3. フロントエンドの環境変数に設定

### 4. フロントエンド環境変数更新
```bash
# Vercel で設定
NEXT_PUBLIC_STRAPI_URL=https://your-strapi-app.railway.app
STRAPI_API_TOKEN=your-generated-token
```

## ⚠️ 注意事項

### セキュリティ
- 本番環境では必ず HTTPS を使用
- 強力なパスワードを設定
- API トークンは適切に管理

### パフォーマンス
- 画像は Cloudinary などの CDN を使用推奨
- データベース接続数の制限に注意

### バックアップ
- 定期的なデータベースバックアップを設定
- メディアファイルのバックアップも忘れずに

## 🔗 参考リンク

- [Strapi Deployment Guide](https://docs.strapi.io/dev-docs/deployment)
- [Railway Documentation](https://docs.railway.app/)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)