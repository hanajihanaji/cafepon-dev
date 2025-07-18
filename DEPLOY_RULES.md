# cafepon-dev デプロイルール

## プロジェクト固有のデプロイ手順

### 基本情報
- **リポジトリ**: https://github.com/hanajihanaji/cafepon-website.git
- **デプロイ方法**: Git push による自動デプロイ
- **メインブランチ**: master
- **本番URL**: 
  - https://cafepon.com
  - https://www.cafepon.com

### デプロイ手順
```bash
# 1. 変更をステージングに追加
git add .

# 2. コミットメッセージを作成
git commit -m "feat: 変更内容の説明"

# 3. リモートリポジトリにプッシュ（自動デプロイ実行）
git push origin master
```

### 注意事項
- masterブランチへの直接プッシュで自動デプロイされる
- 変更前は必ずビルドテストを実行する: `npm run build`
- 静的ファイル（public/）の変更もデプロイ対象
- Google Analytics設定（GA4）が含まれている

### 対象ファイル構成
```
# Next.jsアプリケーション構成
app/
├── hakos-baelz-4thanniversary/
│   └── page.tsx                    # キャンペーンサイト（Reactページ）
├── layout.tsx                      # グローバルレイアウト
├── page.tsx                        # メインサイト
└── menu/
    └── page.tsx                    # メニューページ

public/
└── hakos-baelz-4thanniversary/
    └── assets/
        └── logos/
            ├── logo-color.png      # ローディング用ロゴ
            └── project-title.png   # ヘッダータイトル画像
```

### 関連コマンド
```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# Git状態確認
git status

# リモート確認
git remote -v
```

### 最終更新
- 2025-07-18: キャンペーンサイトをNext.jsページに移行、EXCELデータ反映、カラーテーマ拡張（5→7）