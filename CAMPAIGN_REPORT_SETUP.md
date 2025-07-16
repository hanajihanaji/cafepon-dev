# べーちゃん4周年記念キャンペーン レポート自動生成システム

## 🎯 概要

このシステムは、べーちゃん4周年記念キャンペーンサイトのアクセス解析データを自動収集し、カバー株式会社向けの美しいレポートを生成します。

## 🎨 デザイン仕様

**カラーテーマ：**
- **Base Color**: `#fe3a2d` (べーちゃんメインカラー)
- **Accent Color**: `#ff938d` (べーちゃんアクセントカラー)
- **背景グラデーション**: べーちゃんカラーに合わせた統一感のあるデザイン

## 📊 測定データ

### 基本指標
- 総アクセス数（ユニークユーザー）
- YouTube遷移数
- コンバージョン率（アクセス→YouTube遷移）
- モバイル利用率

### 詳細分析
- 日別アクセス・遷移推移
- 人気テーマ分析
- デバイス別利用状況
- 時間帯別トレンド

## 🚀 セットアップ手順

### 1. Google Apps Script プロジェクト作成

1. **Google Apps Script**（https://script.google.com/）にアクセス
2. 「新しいプロジェクト」を作成
3. プロジェクト名：「べーちゃん4周年キャンペーンレポート」

### 2. スクリプトファイルの設定

#### メインスクリプト（Code.gs）
```javascript
// campaign-report-generator.gs の内容をコピー
```

#### HTMLテンプレート（report-template.html）
```html
<!-- report-template.html の内容をコピー -->
```

### 3. GA4 Reporting API有効化

1. **Google Cloud Console**（https://console.cloud.google.com/）で新しいプロジェクト作成
2. **Analytics Reporting API**を有効化
3. **サービスアカウント**を作成してJSONキーをダウンロード
4. GA4で**サービスアカウント**にViewer権限を付与

### 4. 設定値の更新

**CONFIG オブジェクトの更新：**
```javascript
const CONFIG = {
  EVENT_START: '2025-08-18',      // イベント開始日
  EVENT_END: '2025-09-15',        // イベント終了日
  GA4_PROPERTY_ID: 'XXXXXXXXX',   // GA4プロパティID
  REPORT_RECIPIENTS: [
    'cover-report@example.com'     // カバー担当者メール
  ]
};
```

## 📅 実行スケジュール

### イベント期間中（2025/8/18 - 2025/9/15）
- **監視のみ** - データ収集継続
- **手動確認** - 必要に応じてリアルタイムGA4確認

### イベント終了後（2025/9/16以降）
- **レポート生成** - `generateCampaignReport()` 関数を手動実行
- **自動送信** - カバー担当者に自動でメール送信

## 🛠️ 実行手順

### 1. 事前準備
```bash
# イベント期間の確認
console.log('イベント期間:', CONFIG.EVENT_START, 'から', CONFIG.EVENT_END);
```

### 2. レポート生成（イベント終了後）
```javascript
// Google Apps Script エディタで実行
generateCampaignReport();
```

### 3. 期間変更（必要に応じて）
```javascript
// イベント期間変更時
updateEventPeriod('2025-08-18', '2025-09-15');
```

## 📧 レポート出力

### 生成されるファイル
- **HTMLレポート** - インタラクティブなビジュアルレポート
- **自動メール** - カバー担当者に直接送信

### レポート内容
- 📊 期間サマリー
- 📈 日別推移グラフ
- 🎨 人気テーマ分析
- 💡 効果分析・洞察

## 🔧 カスタマイズ

### 期間変更
```javascript
// イベント期間の延長・短縮
CONFIG.EVENT_START = '2025-08-20';
CONFIG.EVENT_END = '2025-09-20';
```

### 送信先追加
```javascript
// 複数の送信先設定
CONFIG.REPORT_RECIPIENTS = [
  'cover-report@example.com',
  'manager@example.com',
  'analytics@example.com'
];
```

### デザイン調整
```css
/* べーちゃんカラーの調整 */
--baelz-primary: #fe3a2d;
--baelz-accent: #ff938d;
--baelz-light: #ffb3b3;
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. GA4データが取得できない
- **原因**: API権限不足
- **解決**: サービスアカウントのGA4権限を確認

#### 2. メール送信エラー
- **原因**: Gmail API制限
- **解決**: Apps Script の実行制限を確認

#### 3. レポートが空白
- **原因**: テンプレートファイルの問題
- **解決**: HTMLテンプレートの構文を確認

### デバッグ方法
```javascript
// デバッグモードでの実行
function debugReport() {
  const data = fetchGA4Data();
  console.log('取得データ:', data);
}
```

## 📞 サポート

**問題発生時の連絡先:**
- 技術サポート: [担当者メール]
- GA4関連: [アナリティクス担当者]
- デザイン調整: [デザイン担当者]

## 🔄 バージョン管理

- **v1.0** - 基本レポート機能
- **v1.1** - べーちゃんカラー対応
- **v1.2** - 日別データ詳細化

---

**作成日**: 2025年7月16日  
**最終更新**: イベント期間設定完了  
**対象イベント**: べーちゃん4周年記念キャンペーン（2025/8/18-9/15）