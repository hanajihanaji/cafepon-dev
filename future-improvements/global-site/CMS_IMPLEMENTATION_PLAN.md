# CMS導入実装計画 - Strapi + Next.js

## 📋 **導入決定事項**

### 🎯 **選定CMS: Strapi**
- **理由**: 柔軟性、日本語対応、Next.js親和性、コスト効率
- **アーキテクチャ**: Headless CMS
- **データベース**: PostgreSQL

### 🏗️ **システム構成**
```yaml
フロントエンド: Next.js (Vercel) ← 変更なし
CMS: Strapi (Railway/Render/VPS)
データベース: PostgreSQL
画像管理: Cloudinary (無料枠)
ドメイン: cafepon.com ← 変更なし
```

## 💰 **コスト構成**

### 🆓 **無料版構成**
```yaml
CMS: Strapi (Render無料版)
  - 15分無アクセスでスリープ
  - 月750時間上限
  - 初回アクセス30秒待機

DB: PlanetScale無料版
  - 1GB容量
  - 1億reads/月

画像: Cloudinary無料版
  - 10GB容量
  - 基本変換機能

月額コスト: ¥0
```

### 💪 **安定版構成**
```yaml
CMS: Strapi (Railway)
  - 常時稼働
  - CPU: 0.5vCPU, RAM: 512MB
  - PostgreSQL込み
  - SSL証明書自動

月額コスト: $5 (約¥800)
```

### 🔧 **VPS構成** (技術力必要)
```yaml
サーバー: さくらVPS (¥880/月)
  - Ubuntu 22.04 LTS
  - 1GB RAM, 25GB SSD
  - PostgreSQL自前構築
  

月額コスト: ¥880 + 管理負荷
```

## 🚀 **実装ロードマップ**

### **Phase 1: 環境構築** (所要時間: 1-2時間)
1. **ローカル環境テスト** (30分)
   ```bash
   npx create-strapi-app@latest cafepon-cms --quickstart
   cd cafepon-cms
   npm run develop
   # http://localhost:1337/admin でアクセス
   ```

2. **本番環境選択・構築** (30-60分)
   - **Railway**: ワンクリックデプロイ
   - **Render**: GitHub連携自動デプロイ
   - **VPS**: 手動セットアップ

3. **管理者アカウント作成** (5分)

### **Phase 2: データ構造設計** (所要時間: 1時間)

#### **Collection Types 設計**
```typescript
// MenuItem (メニューアイテム)
interface MenuItem {
  id: number;
  name: string;           // "とりもも唐揚げ"
  nameEn: string;        // "Deep Fried Chicken Thigh"
  price: number;         // 900
  description?: string;   // 商品説明
  image?: Media;         // 商品画像
  category: Category;    // カテゴリ参照
  order: number;         // 表示順 (ドラッグ&ドロップ対応)
  isPopular: boolean;    // 人気メニューフラグ
  isAvailable: boolean;  // 提供可能フラグ
  isSeasonal: boolean;   // 季節限定フラグ
  allergens: string[];   // アレルギー情報
  tags: string[];        // タグ（検索用）
  createdAt: Date;
  updatedAt: Date;
}

// Category (カテゴリ)
interface Category {
  id: number;
  name: string;          // "お食事"
  nameEn: string;        // "Food"
  slug: string;          // "food"
  order: number;         // カテゴリ表示順
  description?: string;   // カテゴリ説明
  icon?: string;         // アイコンクラス
  isActive: boolean;     // 表示フラグ
}

// StoreInfo (店舗情報)
interface StoreInfo {
  id: number;
  storeName: string;
  address: string;
  phone: string;
  hours: string;
  holidays: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    line?: string;
  };
  announcements: string; // お知らせ
}
```

#### **並び替え・管理機能**
- ✅ ドラッグ&ドロップ並び替え
- ✅ 数値指定での順序制御
- ✅ カテゴリ別独立管理
- ✅ 人気メニュー・季節限定フラグ
- ✅ 在庫管理・売切れ表示

### **Phase 3: Next.js連携** (所要時間: 1-2時間)

#### **API接続ライブラリ作成**
```typescript
// lib/strapi.ts
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function getMenuItems(options?: {
  category?: string;
  sortBy?: 'order' | 'price' | 'popular' | 'name';
  populate?: string[];
}) {
  const params = new URLSearchParams();
  
  if (options?.category) {
    params.append('filters[category][slug][$eq]', options.category);
  }
  
  if (options?.sortBy) {
    const sortMap = {
      order: 'order:asc',
      price: 'price:asc', 
      popular: 'isPopular:desc,order:asc',
      name: 'name:asc'
    };
    params.append('sort', sortMap[options.sortBy]);
  }
  
  if (options?.populate) {
    params.append('populate', options.populate.join(','));
  }
  
  const response = await fetch(
    `${STRAPI_URL}/api/menu-items?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch menu items');
  }
  
  return response.json();
}

export async function getCategories() {
  const response = await fetch(
    `${STRAPI_URL}/api/categories?sort=order:asc`
  );
  return response.json();
}

export async function getStoreInfo() {
  const response = await fetch(`${STRAPI_URL}/api/store-info`);
  return response.json();
}
```

#### **ISR (Incremental Static Regeneration) 設定**
```typescript
// app/menu/page.tsx
export const revalidate = 300; // 5分キャッシュ

export default async function MenuPage() {
  const [menuData, categories] = await Promise.all([
    getMenuItems({ populate: ['image', 'category'] }),
    getCategories()
  ]);
  
  return <MenuDisplay data={menuData.data} categories={categories.data} />;
}
```

#### **On-Demand Revalidation**
```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { tag } = await request.json();
  
  if (tag === 'menu') {
    revalidateTag('menu');
    return Response.json({ revalidated: true });
  }
  
  return Response.json({ revalidated: false });
}

// Strapi Webhook設定
// URL: https://cafepon.com/api/revalidate
// Event: menu-item.create, menu-item.update, menu-item.delete
```

### **Phase 4: データ移行** (所要時間: 2-3時間)

#### **ハードコードデータ完全削除**
```typescript
// app/menu/page.tsx
// ❌ 削除対象
const menuData = {
  food: [
    { name: "とりもも唐揚げ", price: 900 }, // 全削除
    // ...
  ]
}

// ✅ 置き換え
const menuData = await getMenuItems();
```

#### **78項目データ投入**
1. **CSVインポート機能活用**
2. **画像アップロード**: `/public/images/` → Cloudinary
3. **カテゴリ分類**: お食事、ドリンク、スイーツ、軽食、おつまみ
4. **表示順設定**: 人気順・戦略的配置

#### **データ整合性チェック**
```bash
# 必須チェック項目
□ 全78項目が正しくインポートされている
□ 画像パスが正しく設定されている
□ カテゴリ分類が適切
□ 価格データに誤りがない
□ 表示順が適切に設定されている
□ 人気メニューフラグが正しい
```

### **Phase 5: 画像管理システム** (所要時間: 1時間)

#### **Cloudinary連携**
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

// 画像最適化
<Image
  src={item.image?.url || '/images/placeholder-food.svg'}
  alt={item.name}
  width={300}
  height={200}
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 300px"
/>
```

#### **画像アップロード対応表活用**
- **High優先度**: 69項目（placeholder置き換え）
- **Medium優先度**: 9項目（既存画像更新）
- **推奨ファイル名**: CSV記載の通り

## 🛡️ **安全対策・運用設計**

### **先祖帰り防止策**
1. **完全データ分離**
   ```typescript
   // 環境変数での制御
   const USE_CMS = process.env.USE_CMS === 'true';
   const menuData = USE_CMS ? await getMenuItems() : fallbackData;
   ```

2. **段階的移行**
   ```bash
   Phase 1: CMS並行運用・確認
   Phase 2: ハードコード完全削除
   Phase 3: CMS専用運用開始
   ```

3. **Git管理ルール**
   ```markdown
   # 重要ルール
   - メニューデータはCMS管理のみ
   - ハードコード追加禁止
   - プルリクエスト時のデータソースチェック必須
   ```

### **バックアップ戦略**
```yaml
コンテンツバックアップ:
  - Strapi: 自動バックアップ機能
  - Database: 日次スナップショット  
  - 画像: Cloudinary永続保存

コードバックアップ:
  - Git: 完全履歴管理継続
  - Vercel: デプロイ履歴保持
```

### **権限管理**
```yaml
管理者権限:
  - メニュー編集: フル権限
  - 店舗情報編集: フル権限
  - ユーザー管理: 制限

スタッフ権限:
  - メニュー閲覧・編集: 可能
  - 価格変更: 承認必要
  - 削除: 不可

読み取り専用:
  - API経由: 公開データのみ
  - 管理画面: アクセス不可
```

## 📈 **運用効率化**

### **管理者操作フロー**
```bash
1. 新メニュー追加
   - Strapi管理画面 → メニュー項目作成
   - 画像アップロード（自動最適化）
   - カテゴリ・価格・説明入力
   - 表示順ドラッグ&ドロップ調整

2. 価格変更
   - 該当項目選択 → 価格フィールド変更
   - 保存 → 即座にサイト反映

3. 季節限定メニュー
   - 季節限定フラグON
   - 期間設定（必要に応じて）
   - 表示順を上位に調整

4. 売切れ管理
   - 提供可能フラグOFF
   - 自動でグレーアウト表示
   - 復活時はフラグON
```

### **キャンペーン・イベント対応**
```typescript
// 特別メニュー・キャンペーン管理
interface CampaignMenu {
  id: number;
  title: string;           // "春の限定メニュー"
  description: string;     // キャンペーン説明
  startDate: Date;         // 開始日
  endDate: Date;          // 終了日
  menuItems: MenuItem[];   // 対象メニュー
  bannerImage?: Media;     // キャンペーンバナー
  isActive: boolean;       // 表示制御
}
```

## 🔧 **技術仕様詳細**

### **パフォーマンス最適化**
```typescript
// Next.js最適化設定
export const revalidate = 300; // 5分キャッシュ
export const fetchCache = 'force-cache';
export const runtime = 'edge'; // Edge Runtime使用

// 画像最適化
const imageConfig = {
  formats: ['image/webp', 'image/avif'],
  sizes: [640, 750, 828, 1080, 1200],
  quality: 80,
  minimumCacheTTL: 86400, // 24時間キャッシュ
};
```

### **SEO対策継続**
```typescript
// メタデータ動的生成
export async function generateMetadata(): Promise<Metadata> {
  const storeInfo = await getStoreInfo();
  
  return {
    title: `${storeInfo.storeName} - 推しと、いっしょに。`,
    description: storeInfo.description,
    openGraph: {
      title: storeInfo.storeName,
      description: storeInfo.description,
      images: [storeInfo.ogImage?.url],
    },
  };
}
```

### **エラーハンドリング**
```typescript
// Fallback機能付きデータ取得
async function getMenuItemsWithFallback() {
  try {
    const data = await getMenuItems();
    return data;
  } catch (error) {
    console.error('CMS接続エラー:', error);
    
    // 緊急時フォールバック
    return {
      data: [
        { 
          id: 1, 
          name: "メニュー準備中", 
          price: 0,
          description: "現在メニューを準備中です。お電話でお問い合わせください。"
        }
      ]
    };
  }
}
```

## 📱 **モバイル・アクセシビリティ**

### **レスポンシブ対応**
```typescript
// Tailwind CSS クラス例
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {menuItems.map(item => (
    <MenuCard 
      key={item.id} 
      item={item}
      className="w-full h-full"
    />
  ))}
</div>
```

### **アクセシビリティ向上**
```typescript
// スクリーンリーダー対応
<Image
  src={item.image?.url}
  alt={`${item.name}の写真。価格は${item.price}円です。`}
  role="img"
  aria-describedby={`menu-desc-${item.id}`}
/>

<p id={`menu-desc-${item.id}`} className="sr-only">
  {item.description || `${item.name}は${item.category.name}カテゴリの商品です。`}
</p>
```

## 🎯 **導入判断基準**

### **導入推奨度: ⭐⭐⭐⭐⭐**

#### **定量的メリット**
```yaml
効率化:
  - メニュー更新時間: 30分 → 3分 (90%短縮)
  - 価格変更: Git作業不要 (100%簡素化)
  - 画像管理: 自動最適化 (品質向上)

コスト:
  - 無料版: ¥0/月
  - 安定版: ¥800/月
  - ROI: 管理工数削減で1-2ヶ月で回収
```

#### **定性的メリット**
```yaml
運用面:
  - 非技術者でも更新可能
  - リアルタイム反映
  - 直感的な管理画面
  - 戦略的メニュー配置

技術面:
  - サイト表示速度維持
  - SEO対策継続
  - セキュリティ向上
  - スケーラビリティ確保
```

## 📅 **実装スケジュール**

### **即座実装可能**
```bash
Day 1: ローカル環境構築・テスト (2時間)
Day 2: 本番環境選択・構築 (1時間)  
Day 3: データ構造設計・投入 (3時間)
Day 4: Next.js連携・確認 (2時間)
Day 5: 画像移行・最終調整 (2時間)

総所要時間: 約10時間 (1週間で完成)
```

### **段階的導入パターン**
```bash
Week 1: ローカル環境での機能確認
Week 2: 本番環境構築・基本設定  
Week 3: データ移行・テスト運用
Week 4: 本格運用開始・最適化
```

## ⚡ **Next Steps**

### **今すぐ開始可能**
1. **ローカル環境構築** (30分)
2. **機能・操作感確認** (1時間)
3. **本格導入判断** (即座)

### **今後の拡張可能性**
- **多店舗対応**: フランチャイズ展開時
- **オンライン注文**: 決済システム連携
- **在庫管理**: リアルタイム在庫連動
- **顧客管理**: 会員システム連携
- **分析機能**: 人気メニュー分析

**Strapi CMS導入により、Cafe PONの運用効率は劇的に向上し、戦略的なメニュー展開が可能になります！** 🚀