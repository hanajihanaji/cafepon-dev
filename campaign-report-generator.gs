/**
 * べーちゃん4周年記念キャンペーン効果測定レポート生成スクリプト
 * Google Apps Script で実行
 */

// 設定
const CONFIG = {
  // イベント期間（変更可能）
  EVENT_START: '2025-08-18',
  EVENT_END: '2025-09-15',
  
  // GA4設定
  GA4_PROPERTY_ID: 'XXXXXXXXX', // GA4プロパティID
  
  // レポート送信先
  REPORT_RECIPIENTS: [
    'cover-report@example.com' // カバー担当者メールアドレス
  ]
};

/**
 * メイン関数：イベント期間終了後に実行
 */
function generateCampaignReport() {
  console.log('キャンペーンレポート生成開始');
  
  // GA4からデータ取得
  const reportData = fetchGA4Data();
  
  // HTMLレポート生成
  const htmlReport = generateHTMLReport(reportData);
  
  // メール送信
  sendReportEmail(htmlReport);
  
  console.log('キャンペーンレポート生成完了');
}

/**
 * GA4データ取得
 */
function fetchGA4Data() {
  console.log('GA4データ取得中...');
  
  // 日別データ取得用クエリ
  const dailyDataQuery = {
    property: `properties/${CONFIG.GA4_PROPERTY_ID}`,
    dateRanges: [{
      startDate: CONFIG.EVENT_START,
      endDate: CONFIG.EVENT_END
    }],
    dimensions: [
      {name: 'date'},
      {name: 'deviceCategory'}
    ],
    metrics: [
      {name: 'activeUsers'},
      {name: 'sessions'},
      {name: 'pageviews'}
    ]
  };
  
  // カスタムイベントデータ取得
  const eventDataQuery = {
    property: `properties/${CONFIG.GA4_PROPERTY_ID}`,
    dateRanges: [{
      startDate: CONFIG.EVENT_START,
      endDate: CONFIG.EVENT_END
    }],
    dimensions: [
      {name: 'date'},
      {name: 'eventName'}
    ],
    metrics: [
      {name: 'eventCount'}
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'CONTAINS',
          value: 'youtube_button_click'
        }
      }
    }
  };
  
  // TODO: 実際のGA4 Reporting API呼び出し
  // const dailyData = AnalyticsReporting.runReport(dailyDataQuery);
  // const eventData = AnalyticsReporting.runReport(eventDataQuery);
  
  // サンプルデータ（開発用）
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
  const template = HtmlService.createTemplateFromFile('report-template');
  template.data = data;
  template.eventStart = CONFIG.EVENT_START;
  template.eventEnd = CONFIG.EVENT_END;
  
  return template.evaluate().getContent();
}

/**
 * レポートメール送信
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

  // HTMLファイルを添付として送信
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
 * 期間変更用関数
 */
function updateEventPeriod(startDate, endDate) {
  CONFIG.EVENT_START = startDate;
  CONFIG.EVENT_END = endDate;
  console.log(`イベント期間を更新: ${startDate} ～ ${endDate}`);
}