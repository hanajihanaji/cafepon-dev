"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getColorScheme } from "@/lib/color-scheme"
import { Logo } from "@/components/logo"
import { getContrastTextColor, darkenColor } from "@/lib/color-utils"
import { BackgroundPattern } from "@/components/background-pattern"
import { XIcon } from "@/components/x-icon"
import ImagePlaceholder from "@/components/image-placeholder"
import { CMSMenu } from "./cms-menu"

// Menu data extracted from the images - reordered: Food, Drinks, Others
const menuData = {
  food: [
    {
      name: "とりもも唐揚げ",
      nameEn: "Deep Fried Chicken Thigh",
      price: 900,
      image: "/images/karaage.jpg",
    },
    {
      name: "ナポリタン",
      nameEn: "Neapolitan Spaghetti",
      price: 850,
      image: "/images/napolitan.jpg",
    },
    {
      name: "豚生姜焼き",
      nameEn: "Pork and Ginger Stir-fry",
      price: 700,
      image: "/images/buta_shogayaki.jpg",
    },
    {
      name: "カレーパスタ",
      nameEn: "Curry Spaghetti",
      price: 850,
      image: "/images/curry_pasta.jpg",
    },
    {
      name: "チキン南蛮",
      nameEn: "Chicken Nanban Rice Bowl",
      price: 950,
      image: "/images/chicken_nanban.jpg",
    },
    {
      name: "豚焼肉丼",
      nameEn: "Grilled Pork Rice Bowl",
      price: 900,
      image: "/images/buta_yakiniku_don.jpg",
    },
    {
      name: "炙りチーズカレー",
      nameEn: "Grilled Cheese Curry",
      price: 850,
      image: "/images/aburi_cheese_curry.jpg",
    },
    {
      name: "ウインナーカレー",
      nameEn: "Vienna Sausage Curry",
      price: 850,
      image: "/images/wiener_curry.jpg",
    },
    {
      name: "フライドチキンカレー",
      nameEn: "Fried Chicken Curry",
      price: 850,
      image: "/images/fried_chicken_curry.jpg",
    },
    {
      name: "チキンかつカレー",
      nameEn: "Chicken Cutlet Curry",
      price: 950,
      image: "/images/chicken_katsu_curry.jpg",
    },
    {
      name: "プルドチキンカレー",
      nameEn: "Pulled Chicken Curry",
      price: 900,
      image: "/images/pulled-chicken-curry.jpg",
    },
    {
      name: "野菜カレー",
      nameEn: "Broccoli Curry",
      price: 850,
      image: "/images/yasai_curry.jpg",
    },
  ],
  drinks: [
    {
      name: "ブレンドコーヒー",
      nameEn: "Blend Coffee",
      price: 550,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アイスコーヒー",
      nameEn: "Iced Coffee",
      price: 600,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "エスプレッソ",
      nameEn: "Espresso",
      price: 600,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "紅茶",
      nameEn: "Black Tea",
      price: 550,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アイス紅茶",
      nameEn: "Iced Black Tea",
      price: 600,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "カフェラテ",
      nameEn: "Café Latte",
      price: 630,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アイスカフェラテ",
      nameEn: "Iced Café Latte",
      price: 680,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "カフェオレ",
      nameEn: "Café au Lait",
      price: 650,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アイスカフェオレ",
      nameEn: "Iced Café au Lait",
      price: 730,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "抹茶ラテ",
      nameEn: "Matcha Latte",
      price: 650,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アイス抹茶ラテ",
      nameEn: "Iced Matcha Latte",
      price: 730,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "ほうじ茶ラテ",
      nameEn: "Hojicha Latte",
      price: 650,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アイスほうじ茶ラテ",
      nameEn: "Iced Hojicha Latte",
      price: 730,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "紅茶ラテ",
      nameEn: "Black Tea Latte",
      price: 730,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アイス紅茶ミルクティー",
      nameEn: "Iced Black Tea Milk Tea",
      price: 730,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "PON手仕込みココア",
      nameEn: "Handmade Cocoa",
      price: 650,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "PON手仕込みアイスココア",
      nameEn: "Handmade Iced Cocoa",
      price: 680,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "大阪LOVEのミックスジュース",
      nameEn: "Osaka LOVE Mixed Juice",
      price: 700,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "クリームソーダー",
      nameEn: "Ice Cream Soda",
      price: 750,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "濃厚チョコバナナジュース",
      nameEn: "Rich Chocolate Banana Juice",
      price: 750,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "アサヒスーパードライゼロ",
      nameEn: "Non-Alcoholic Beer",
      price: 500,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "クラフトコーラ",
      nameEn: "Craft Cola",
      price: 700,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "クラフトジンジャーエール",
      nameEn: "Craft Ginger Ale",
      price: 700,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "コーヒーフロート",
      nameEn: "Coffee Float",
      price: 750,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "一日分の野菜ジュース",
      nameEn: "Vegetable Juice",
      price: 580,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "シークヮーサーソーダ",
      nameEn: "Shekwasha Soda",
      price: 550,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "カルピス",
      nameEn: "Calpis",
      price: 550,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "ミルクdeカルピス",
      nameEn: "Calpis with Milk",
      price: 600,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "丸ごと生レモンジュース",
      nameEn: "Whole Fresh Lemon Juice",
      price: 780,
      image: "/images/placeholder-drink.svg",
    },
    {
      name: "ブルダックモン香るコーヒーゼリーオレ",
      nameEn: "Cardamom Coffee Jelly Latte",
      price: 800,
      image: "/images/placeholder-drink.svg",
    },
  ],
  others: [
    // スイーツ
    {
      name: "紅茶のシフォンケーキ",
      nameEn: "Tea Chiffon Cake",
      price: 480,
      image: "/images/kocha_chiffon_cake.jpg",
      category: "スイーツ",
    },
    {
      name: "出来たてポップコーン",
      nameEn: "Freshly Popped Popcorn",
      price: 400,
      image: "/images/placeholder-sweets.svg",
      category: "スイーツ",
    },
    {
      name: "カルダモン香るコーヒーゼリー",
      nameEn: "Coffee Jelly with Cardamom",
      price: 480,
      image: "/images/placeholder-sweets.svg",
      category: "スイーツ",
    },
    {
      name: "バナナケーキ",
      nameEn: "Banana Cake",
      price: 450,
      image: "/images/placeholder-sweets.svg",
      category: "スイーツ",
    },
    {
      name: "あったか大学いもアイス",
      nameEn: "Warm Sweet Potato with Ice Cream",
      price: 480,
      image: "/images/attaka_daigaku_imo_ice.jpg",
      category: "スイーツ",
    },
    {
      name: "さたぱんびん",
      nameEn: "Okinawan Donut",
      price: 250,
      image: "/images/placeholder-sweets.svg",
      category: "スイーツ",
    },
    // 軽食
    {
      name: "バタートースト",
      nameEn: "Butter Toast",
      price: 450,
      image: "/images/placeholder-lightfood.svg",
      category: "軽食",
    },
    {
      name: "AZUKIジャムサンド",
      nameEn: "Anko Berry Jam Hot Sandwich",
      price: 650,
      image: "/images/placeholder-lightfood.svg",
      category: "軽食",
    },
    {
      name: "アップルカスタードホットサンド",
      nameEn: "Apple Custard Hot Sandwich",
      price: 650,
      image: "/images/placeholder-lightfood.svg",
      category: "軽食",
    },
    {
      name: "グリルチーズホットサンド",
      nameEn: "Grilled Cheese Sandwich",
      price: 700,
      image: "/images/grill_cheese_hot_sandwich.jpg",
      category: "軽食",
    },
    {
      name: "海老カツタルタルサンド",
      nameEn: "Shrimp Cutlet Sandwich",
      price: 700,
      image: "/images/ebi_katsu_tartar_sandwich.jpg",
      category: "軽食",
    },
    {
      name: "ピザトースト",
      nameEn: "Pizza Toast",
      price: 700,
      image: "/images/pizza_toast.jpg",
      category: "軽食",
    },
    {
      name: "チキンカツサンド",
      nameEn: "Chicken Cutlet Sandwich",
      price: 700,
      image: "/images/placeholder-lightfood.svg",
      category: "軽食",
    },
    {
      name: "南国チーズトースト",
      nameEn: "Corned Beef Hash and Cheese Toast",
      price: 900,
      image: "/images/placeholder-lightfood.svg",
      category: "軽食",
    },
    // おつまみ
    {
      name: "お好み焼き串",
      nameEn: "Okonomiyaki Skewers",
      price: 480,
      image: "/images/placeholder-food.svg",
      category: "おつまみ",
    },
    {
      name: "わかめの唐揚げ",
      nameEn: "Crispy Fried Wakame Seaweed",
      price: 400,
      image: "/images/wakame_karaage.jpg",
      category: "おつまみ",
    },
    {
      name: "ポテトフライ",
      nameEn: "French Fries",
      price: 450,
      image: "/images/placeholder-food.svg",
      category: "おつまみ",
    },
    {
      name: "チキン南蛮",
      nameEn: "Chicken Nanban",
      price: 700,
      image: "/images/placeholder-food.svg",
      category: "おつまみ",
    },
    {
      name: "なんこつ唐揚げ",
      nameEn: "Deep-fried Chicken Knee Cartilage",
      price: 450,
      image: "/images/nankotsu_karaage.jpg",
      category: "おつまみ",
    },
    {
      name: "カリカリタコ焼き",
      nameEn: "Fried Takoyaki",
      price: 480,
      image: "/images/karikari_takoyaki.jpg",
      category: "おつまみ",
    },
    {
      name: "おつまみ唐揚げ",
      nameEn: "Fried Chicken Thigh",
      price: 500,
      image: "/images/placeholder-food.svg",
      category: "おつまみ",
    },
    {
      name: "PON特製やきそば",
      nameEn: "Special Yakisoba",
      price: 850,
      image: "/images/pon_tokuseitaku_yakisoba.jpg",
      category: "おつまみ",
    },
  ],
}

export default function MenuPage() {
  const [colors, setColors] = useState({
    baseColor: "#fe4b74",
    accentColor: "#ff9cb4",
    baseTextColor: "#ffffff",
    accentTextColor: "#000000",
  })

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const colorScheme = getColorScheme()
    const baseTextColor = getContrastTextColor(colorScheme.baseColor)
    const accentTextColor = getContrastTextColor(colorScheme.accentColor)

    setColors({
      ...colorScheme,
      baseTextColor,
      accentTextColor,
    })

    // Apply CSS variables
    document.documentElement.style.setProperty("--base-color", colorScheme.baseColor)
    document.documentElement.style.setProperty("--accent-color", colorScheme.accentColor)
    document.documentElement.style.setProperty("--base-text-color", baseTextColor)
    document.documentElement.style.setProperty("--accent-text-color", accentTextColor)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // 初期設定
    handleResize()

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleResize)
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const MenuSection = ({ title, items, showImages = true, categoryType }: { title: string; items: any[]; showImages?: boolean; categoryType: 'お食事' | 'ドリンク' | 'スイーツ' | '軽食' | 'おつまみ' }) => (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-8 text-center pop-font" style={{ color: colors.accentColor }}>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow backdrop-blur-sm bg-white/85">
            <CardContent className="p-4">
              {showImages && (
                <div className="mb-4">
                  {item.image && !item.image.includes('placeholder') ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={200}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <ImagePlaceholder 
                      category={categoryType}
                      itemName={item.name}
                      className="w-full h-48"
                    />
                  )}
                </div>
              )}
              <h3 className="font-bold text-lg mb-2 menu-item-name" style={{ color: colors.baseColor }}>
                {item.name}
              </h3>
              {item.nameEn && <p className="text-gray-600 text-sm mb-2">{item.nameEn}</p>}
              {item.category && (
                <p className="text-xs text-gray-500 mb-2 bg-gray-100 px-2 py-1 rounded inline-block">{item.category}</p>
              )}
              <p className="text-2xl font-bold menu-price" style={{ color: colors.accentColor }}>
                ¥{item.price}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )

  // その他のメニューをカテゴリ別に分ける
  const sweets = menuData.others.filter((item) => item.category === "スイーツ")
  const lightFood = menuData.others.filter((item) => item.category === "軽食")
  const snacks = menuData.others.filter((item) => item.category === "おつまみ")

  return (
    <div className="min-h-screen relative">
      {/* Background Pattern */}
      <BackgroundPattern baseColor={colors.baseColor} accentColor={colors.accentColor} />

      {/* Semi-transparent background overlay - より透明に */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: colors.baseColor + "B3", // 70% opacity (より透明)
          zIndex: -1,
        }}
      />

      {/* Header - Fixed with scroll effect */}
      <header
        className={`fixed top-0 left-0 right-0 p-4 z-50 transition-all duration-300 ${
          isScrolled ? "backdrop-blur-md shadow-lg" : ""
        }`}
        style={{
          backgroundColor: isScrolled
            ? colors.baseColor + "E6" // 90% opacity when scrolled
            : colors.baseColor + "CC", // 80% opacity at top
        }}
      >
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size={isMobile ? "sm" : "md"} />
          {isMobile ? (
            // モバイル向けシンプルナビ
            <div className="flex items-center space-x-3">
              <Link href="/" className="hover:opacity-80 font-medium pop-font text-sm" style={{ color: colors.baseTextColor }}>
                HOME
              </Link>
              <div className="flex items-center space-x-2">
                <a
                  href="https://www.instagram.com/cafe_pon_kandakaji3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Instagram className="w-4 h-4" style={{ color: colors.baseTextColor }} />
                </a>
                <a
                  href="https://x.com/aenbien_pon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <XIcon className="w-4 h-4" style={{ color: colors.baseTextColor }} />
                </a>
              </div>
            </div>
          ) : (
            // デスクトップ向けフルナビ
            <div className="flex items-center space-x-6">
              <Link href="/" className="hover:opacity-80 font-medium pop-font" style={{ color: colors.baseTextColor }}>
                HOME
              </Link>
              <Link
                href="/menu"
                className="hover:opacity-80 font-medium pop-font"
                style={{ color: colors.baseTextColor }}
              >
                MENU
              </Link>
              <div className="flex items-center space-x-2">
                <a
                  href="https://www.instagram.com/cafe_pon_kandakaji3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Instagram className="w-5 h-5" style={{ color: colors.baseTextColor }} />
                </a>
                <a
                  href="https://x.com/aenbien_pon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <XIcon className="w-5 h-5" style={{ color: colors.baseTextColor }} />
                </a>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Back Button - モバイルでは非表示 */}
      {!isMobile && (
        <div className="p-4 pt-24 relative z-10">
          <Button
            asChild
            variant="ghost"
            className="hover:bg-white/20 backdrop-blur-sm"
            style={{ color: colors.baseTextColor, borderColor: colors.baseTextColor }}
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              ホームに戻る
            </Link>
          </Button>
        </div>
      )}

      {/* Menu Content */}
      <div className={`px-4 pb-16 relative z-10 ${isMobile ? 'pt-20' : ''}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg ${isMobile ? 'p-4' : 'p-8'}`}>
            <h1 className={`font-bold text-center pop-font ${isMobile ? 'text-2xl mb-6' : 'text-4xl mb-12'}`} style={{ color: colors.baseColor }}>
              Menu
            </h1>

            {/* CMS連携メニュー - モバイルとデスクトップで切り替え */}
            {/* CMS連携メニュー - PC版レスポンシブ表示（上部タブは維持） */}
            <CMSMenu colors={colors} isMobile={isMobile} />
            {/* 既存の静的メニュー（CMSデータがない場合のフォールバック内で表示） */}


          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="py-8 px-4 relative z-10"
        style={{ backgroundColor: darkenColor(colors.baseColor, 0.1) + "CC" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a
              href="https://www.instagram.com/cafe_pon_kandakaji3/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Instagram className="w-6 h-6" style={{ color: colors.baseTextColor }} />
            </a>
            <a
              href="https://x.com/aenbien_pon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <XIcon className="w-6 h-6" style={{ color: colors.baseTextColor }} />
            </a>
          </div>
          <p style={{ color: colors.baseTextColor }} className="text-sm">
            © 2024 Cafe PON. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
