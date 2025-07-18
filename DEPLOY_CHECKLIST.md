# デプロイ対象ファイルチェックリスト

## 今回のデプロイ対象

### ✅ デプロイするファイル（本番環境に反映）
- `public/hakos-baelz-4thanniversary/index.html` - アンケートボタン追加
- `public/hakos-baelz-4thanniversary/css/style.css` - スタイル調整（アンケートボタン、余白調整）
- `public/hakos-baelz-4thanniversary/assets/logos/logo-color.png` - ロゴ画像更新
- `public/hakos-baelz-4thanniversary/assets/logos/project-title.png` - タイトル画像更新

### ❌ デプロイしないファイル（プロジェクト管理用）
- `DEPLOY_RULES.md` - デプロイルール説明書
- `DEPLOY_CHECKLIST.md` - このチェックリスト
- `campaign-report-generator-fixed.gs` - Google Apps Script
- `complete-ga4-report-system.gs` - Google Apps Script
- `ga4-data-api-integration.gs` - Google Apps Script
- `report-template-simple.html` - レポートテンプレート

### 📋 変更内容
1. **アンケートボタン追加**
   - Google Forms (forms.gle/kbcXyxmzYnUE5s9E9) へのリンク
   - べーちゃんカラー（#ff938d）でデザイン統一

2. **レイアウト調整**
   - タイトル周りの余白を調整
   - ヘッダーpadding: 2rem → 1rem
   - タイトルコンテナmargin: 1rem → 0.5rem

3. **画像更新**
   - ロゴとタイトル画像の更新

## デプロイ前チェック
- [ ] public/hakos-baelz-4thanniversary/ 配下のファイルのみ対象
- [ ] プロジェクト管理用ファイルは除外
- [ ] 変更内容が意図通りか確認
- [ ] テスト用ファイルは含めない