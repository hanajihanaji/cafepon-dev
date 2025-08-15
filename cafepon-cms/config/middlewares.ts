export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      headers: '*',
      origin: [
        'http://localhost:3000', // Next.js開発サーバー
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002', // 新しいポート追加
        'http://127.0.0.1:3002',
        'http://localhost:3003', // 現在のNext.jsポート
        'http://127.0.0.1:3003',
        'http://localhost:3004', // 新しいNext.jsポート
        'http://127.0.0.1:3004',
        // 本番環境用
        ...(process.env.NODE_ENV === 'production' 
          ? [process.env.FRONTEND_URL || 'https://your-app.vercel.app'] 
          : []
        ),
        // Vercelドメインパターン
        /\.vercel\.app$/
      ]
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
