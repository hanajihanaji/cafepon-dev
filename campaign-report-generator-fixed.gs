/**
 * べーちゃん4周年記念キャンペーン効果測定レポート生成スクリプト
 * Google Apps Script で実行（修正版）
 */

// 設定
const CONFIG = {
  // イベント期間（変更可能）
  EVENT_START: '2025-08-18',
  EVENT_END: '2025-09-15',
  
  // GA4設定
  GA4_PROPERTY_ID: 'G-PEMLSDYL0N', // 実際のプロパティID
  
  // レポート送信先
  REPORT_RECIPIENTS: [
    'your-email@gmail.com' // あなたのメールアドレスに変更
  ]
};

/**
 * テスト用関数：サンプルデータでレポート生成
 */
function testReportGeneration() {
  console.log('テスト用レポート生成開始');
  
  try {
    // サンプルデータ取得
    const reportData = fetchSampleData();
    
    // HTMLレポート生成
    const htmlReport = generateHTMLReport(reportData);
    
    // Googleドライブに保存（メール送信の代わり）
    const fileUrl = saveReportToDrive(htmlReport);
    
    console.log('テスト用レポート生成完了');
    console.log('ファイルURL:', fileUrl);
    
    return fileUrl;
    
  } catch (error) {
    console.error('エラー:', error.toString());
    throw error;
  }
}

/**
 * 実際のGA4データ取得（後で実装）
 */
function fetchGA4DataReal() {
  console.log('GA4データ取得中...');
  
  try {
    // GA4 Data API を使用
    const propertyId = CONFIG.GA4_PROPERTY_ID;
    
    // 基本的なクエリ
    const request = {
      property: `properties/${propertyId}`,
      dateRanges: [{
        startDate: CONFIG.EVENT_START,
        endDate: CONFIG.EVENT_END
      }],
      dimensions: [
        {name: 'date'}
      ],
      metrics: [
        {name: 'activeUsers'},
        {name: 'sessions'},
        {name: 'pageviews'}
      ]
    };
    
    // TODO: 実際のAPI呼び出し
    // const response = AnalyticsData.Properties.runReport(request);
    
    // サンプルデータを返す（開発中）
    return fetchSampleData();
    
  } catch (error) {
    console.error('GA4データ取得エラー:', error);
    return fetchSampleData(); // エラー時はサンプルデータを使用
  }
}

/**
 * サンプルデータ生成
 */
function fetchSampleData() {
  return {
    summary: {
      totalUsers: 1250,
      totalSessions: 1480,
      totalPageViews: 2960,
      totalYouTubeClicks: 420,
      conversionRate: 33.6,
      avgSessionDuration: 145
    },
    dailyData: generateSampleDailyData(),
    deviceData: {
      mobile: 78,
      desktop: 22
    },
    popularThemes: [
      {theme: 'red', count: 120},
      {theme: 'pink', count: 98},
      {theme: 'orange', count: 87},
      {theme: 'coral', count: 115}
    ]
  };
}

/**
 * サンプル日別データ生成
 */
function generateSampleDailyData() {
  const data = [];
  const startDate = new Date(CONFIG.EVENT_START);
  const endDate = new Date(CONFIG.EVENT_END);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    
    // 週末は平日より20%アクセス増加
    const baseUsers = Math.floor(Math.random() * 30) + 20;
    const users = isWeekend ? Math.floor(baseUsers * 1.2) : baseUsers;
    const youtubeClicks = Math.floor(users * (Math.random() * 0.4 + 0.2));
    
    data.push({
      date: dateStr,
      users: users,
      sessions: Math.floor(users * 1.2),
      pageViews: Math.floor(users * 2.4),
      youtubeClicks: youtubeClicks,
      conversionRate: Math.round((youtubeClicks / users) * 100 * 10) / 10
    });
  }
  
  return data;
}

/**
 * HTMLレポート生成
 */
function generateHTMLReport(data) {
  try {
    const template = HtmlService.createTemplateFromFile('report-template-simple');
    template.data = data;
    template.eventStart = CONFIG.EVENT_START;
    template.eventEnd = CONFIG.EVENT_END;
    
    return template.evaluate().getContent();
    
  } catch (error) {
    console.error('HTMLレポート生成エラー:', error);
    
    // 簡単なHTMLレポートを生成
    return generateSimpleHTMLReport(data);
  }
}

/**
 * シンプルなHTMLレポート生成（バックアップ）
 */
function generateSimpleHTMLReport(data) {
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>べーちゃん4周年記念キャンペーン効果測定レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #fe3a2d; color: white; padding: 20px; border-radius: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; }
        .card-value { font-size: 2em; font-weight: bold; color: #fe3a2d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>べーちゃん4周年記念キャンペーン効果測定レポート</h1>
        <p>期間: ${CONFIG.EVENT_START} ～ ${CONFIG.EVENT_END}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <div class="card-value">${data.summary.totalUsers}</div>
            <div>総アクセス数</div>
        </div>
        <div class="card">
            <div class="card-value">${data.summary.totalYouTubeClicks}</div>
            <div>YouTube遷移数</div>
        </div>
        <div class="card">
            <div class="card-value">${data.summary.conversionRate}%</div>
            <div>コンバージョン率</div>
        </div>
        <div class="card">
            <div class="card-value">${data.deviceData.mobile}%</div>
            <div>モバイル利用率</div>
        </div>
    </div>
    
    <p>Generated on ${new Date().toLocaleDateString('ja-JP')}</p>
</body>
</html>`;
  
  return html;
}

/**
 * レポートをGoogleドライブに保存
 */
function saveReportToDrive(htmlContent) {
  try {
    const fileName = `べーちゃん4周年キャンペーンレポート_${new Date().toISOString().split('T')[0]}.html`;
    const blob = Utilities.newBlob(htmlContent, 'text/html', fileName);
    const file = DriveApp.createFile(blob);
    
    console.log(`レポートを保存しました: ${file.getUrl()}`);
    return file.getUrl();
    
  } catch (error) {
    console.error('ドライブ保存エラー:', error);
    throw error;
  }
}

/**
 * 本番用：メール送信機能
 */
function sendReportEmail(htmlContent) {
  const subject = `べーちゃん4周年記念キャンペーン効果測定レポート（${CONFIG.EVENT_START}～${CONFIG.EVENT_END}）`;
  
  const emailBody = `
カバー株式会社 御中

いつもお世話になっております。

べーちゃん4周年記念キャンペーンの効果測定レポートをお送りいたします。

【キャンペーン期間】
${CONFIG.EVENT_START} ～ ${CONFIG.EVENT_END}

詳細なデータは添付のHTMLレポートをご確認ください。

何かご質問がございましたら、お気軽にお声かけください。

よろしくお願いいたします。
`;

  const htmlBlob = Utilities.newBlob(htmlContent, 'text/html', `campaign-report-${CONFIG.EVENT_END}.html`);
  
  CONFIG.REPORT_RECIPIENTS.forEach(recipient => {
    GmailApp.sendEmail(
      recipient,
      subject,
      emailBody,
      {
        attachments: [htmlBlob],
        htmlBody: emailBody.replace(/\n/g, '<br>')
      }
    );
  });
  
  console.log('レポートメール送信完了');
}

/**
 * 本番用：フルレポート生成
 */
function generateCampaignReport() {
  console.log('キャンペーンレポート生成開始');
  
  try {
    // 実際のGA4データ取得（まだサンプルデータ）
    const reportData = fetchGA4DataReal();
    
    // HTMLレポート生成
    const htmlReport = generateHTMLReport(reportData);
    
    // メール送信
    sendReportEmail(htmlReport);
    
    console.log('キャンペーンレポート生成完了');
    
  } catch (error) {
    console.error('レポート生成エラー:', error);
    throw error;
  }
}