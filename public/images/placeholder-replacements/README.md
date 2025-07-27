# プレースホルダー画像置き換え用フォルダ

このフォルダには、現在使用中のプレースホルダー画像を置き換える実際の商品写真を格納します。

## フォルダ構造

```
placeholder-replacements/
├── drinks/      # ドリンク商品の画像 (30商品)
├── sweets/      # スイーツ商品の画像 (4商品)
├── lightfood/   # 軽食商品の画像 (5商品)
├── food/        # 料理・おつまみ商品の画像 (10商品)
└── README.md    # このファイル
```

## 置き換え対象のプレースホルダー

1. **placeholder-drink.svg** → `drinks/` フォルダ内の実際の画像
2. **placeholder-sweets.svg** → `sweets/` フォルダ内の実際の画像
3. **placeholder-lightfood.svg** → `lightfood/` フォルダ内の実際の画像
4. **placeholder-food.svg** → `food/` フォルダ内の実際の画像

## 画像ファイル名規則

CSVファイル (`cafepon_image_requirements.csv`) に記載された推奨ファイル名を使用してください。

例:
- `blend_coffee.jpg`
- `iced_coffee.jpg`
- `butter_toast.jpg`
- `chicken_katsu_sandwich.jpg`

## 使用方法

1. 各カテゴリフォルダに対応する商品画像を配置
2. CSVファイルの推奨ファイル名に従ってリネーム
3. 画像が揃ったら、メニューページのコードを更新して実際の画像パスに変更

## 注意事項

- 画像サイズ: 推奨 800x600px以上
- ファイル形式: JPG/PNG
- ファイルサイズ: 500KB以下推奨
- 画像品質: 商品が鮮明に見えるクオリティを維持