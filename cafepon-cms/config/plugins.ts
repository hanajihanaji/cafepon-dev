export default ({ env }) => ({
  // 国際化機能を有効化
  i18n: {
    enabled: true
  },
  // 日本語化プラグインを有効化（Strapi再起動完了後にインストール）
  // 'strapi-plugin-ja-pack': {
  //   enabled: true,
  //   config: {
  //     // カスタム翻訳設定
  //     translations: {
  //       "Menu Item": "メニュー項目", 
  //       "Category": "カテゴリー",
  //       "name": "名前",
  //       "price": "価格",
  //       "description": "説明"
  //     }
  //   }
  // }
});
