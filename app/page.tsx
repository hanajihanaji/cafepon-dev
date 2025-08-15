"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, Clock, Instagram, Coffee, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getColorScheme } from "@/lib/color-scheme"
import { Logo } from "@/components/logo"
import { getContrastTextColor, darkenColor } from "@/lib/color-utils"
import { BackgroundPattern } from "@/components/background-pattern"
import { XIcon } from "@/components/x-icon"
import Image from "next/image"

export default function HomePage() {
  const [colors, setColors] = useState({
    baseColor: "#fe4b74",
    accentColor: "#ff9cb4",
    baseTextColor: "#ffffff",
    accentTextColor: "#000000",
  })

  const [isScrolled, setIsScrolled] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // クライアントサイドでのみ実行されることを保証
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const colorScheme = getColorScheme()
    const baseTextColor = getContrastTextColor(colorScheme.baseColor)
    const accentTextColor = getContrastTextColor(colorScheme.accentColor)

    const newColors = {
      ...colorScheme,
      baseTextColor,
      accentTextColor,
    }

    setColors(newColors)

    // CSS変数の設定をより安全に
    const root = document.documentElement
    if (root) {
      root.style.setProperty("--base-color", colorScheme.baseColor)
      root.style.setProperty("--accent-color", colorScheme.accentColor)
      root.style.setProperty("--base-text-color", baseTextColor)
      root.style.setProperty("--accent-text-color", accentTextColor)
    }
  }, [isClient])

  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isClient])

  // クライアントサイドでのみレンダリング
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Cafe PON...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Pattern */}
      <BackgroundPattern baseColor={colors.baseColor} accentColor={colors.accentColor} />

      {/* Semi-transparent background overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: `${colors.baseColor}B3`,
          zIndex: -1,
        }}
      />

      {/* Header - Fixed with scroll effect */}
      <header
        className={`fixed top-0 left-0 right-0 p-4 z-50 transition-all duration-300 ${
          isScrolled ? "backdrop-blur-md shadow-lg" : ""
        }`}
        style={{
          backgroundColor: isScrolled ? `${colors.baseColor}E6` : `${colors.baseColor}CC`,
        }}
      >
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="hover:opacity-80 font-medium pop-font transition-opacity"
              style={{ color: colors.baseTextColor }}
            >
              HOME
            </Link>
            <Link
              href="/menu"
              className="hover:opacity-80 font-medium pop-font transition-opacity"
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
                <Instagram
                  className="w-5 h-5"
                  style={{ color: colors.baseTextColor }}
                />
              </a>
              <a
                href="https://x.com/aenbien_pon"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <XIcon
                  className="w-5 h-5"
                  style={{ color: colors.baseTextColor }}
                />
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Visual with Background Image */}
      <section className="relative py-20 px-4 min-h-[80vh] flex items-center pt-32">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image src="/images/cafe-interior.avif" alt="Cafe PON Interior" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <div className="flex justify-center lg:justify-start">
            <div
              className="rounded-3xl p-8 backdrop-blur-sm border-2 shadow-2xl max-w-lg transition-all duration-300"
              style={{
                backgroundColor: `${colors.accentColor}80`,
                borderColor: `${colors.baseColor}60`,
              }}
            >
              <h1
                className="text-4xl lg:text-5xl font-bold mb-6 pop-font text-shadow-lg transition-colors duration-300"
                style={{ color: colors.accentTextColor }}
              >
                Welcome to
                <br />
                Cafe PON
              </h1>
              <p
                className="text-lg lg:text-xl mb-8 text-shadow transition-colors duration-300"
                style={{ color: colors.accentTextColor }}
              >
                "推し"といっしょに、心温まるひとときを
              </p>
              <Button
                asChild
                className="text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: colors.baseColor,
                  color: colors.baseTextColor,
                }}
              >
                <Link href="/menu">メニューを見る</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2
              className="text-3xl font-bold mb-8 text-center transition-colors duration-300"
              style={{ color: colors.baseColor }}
            >
              人気メニュー
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "PON特製ラテ", desc: "自家製シロップが決め手の人気ドリンク", price: 680, icon: Coffee },
                { name: "ふわふわパンケーキ", desc: "季節のフルーツと一緒に", price: 850, icon: Utensils },
                { name: "チキンカレー", desc: "スパイシーで濃厚な味わい", price: 950, icon: Utensils },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="overflow-hidden hover:shadow-lg transition-shadow backdrop-blur-sm bg-white/85"
                >
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gray-200 flex items-center justify-center">
                      <item.icon className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-bold text-lg mb-2 transition-colors duration-300"
                        style={{ color: colors.baseColor }}
                      >
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{item.desc}</p>
                      <p
                        className="text-xl font-bold transition-colors duration-300"
                        style={{ color: colors.accentColor }}
                      >
                        ¥{item.price}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2
              className="text-3xl font-bold mb-8 text-center transition-colors duration-300"
              style={{ color: colors.baseColor }}
            >
              Cafe PONの雰囲気
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card
                  key={index}
                  className="overflow-hidden hover:shadow-lg transition-shadow backdrop-blur-sm bg-white/85"
                >
                  <CardContent className="p-0">
                    <div className="relative h-32 bg-gray-200 flex items-center justify-center">
                      <div className="text-xs text-gray-500">画像{index + 1}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button
                asChild
                variant="outline"
                style={{
                  borderColor: colors.baseColor,
                  color: colors.baseColor,
                }}
                className="hover:bg-opacity-10 backdrop-blur-sm transition-all duration-300"
              >
                <a
                  href="https://x.com/aenbien_pon"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  マスターのX
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2
              className="text-3xl font-bold mb-6 text-center transition-colors duration-300"
              style={{ color: colors.accentColor }}
            >
              Cafe PONについて
            </h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  神田鍛冶町にあるCafe PONは、学生さんから社会人の方、観光でお越しの皆様まで、
                  どなたでもカジュアルにお立ち寄りいただけるカフェです。
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  ポップでカラフルな店内で、美味しいコーヒーやお食事、 手作りスイーツをお楽しみください。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  なお、マスターは35Pでろぼさーであり、もはや箱推しです。皆さんの推しのことも、聞かせてくれると嬉しいです！
                </p>
              </div>
              <div className="text-center">
                <div
                  className="w-64 h-64 mx-auto rounded-full overflow-hidden backdrop-blur-sm border-4 transition-all duration-300"
                  style={{ borderColor: colors.accentColor }}
                >
                  <Image
                    src="/images/foodpic10133983(1).jpg"
                    alt="Cafe PON Food"
                    width={256}
                    height={256}
                    className="w-full h-full object-cover object-[center_80%]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h2
              className="text-3xl font-bold mb-8 text-center transition-colors duration-300"
              style={{ color: colors.accentColor }}
            >
              アクセス・営業時間
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-start space-x-3 mb-6">
                  <MapPin className="w-6 h-6 mt-1 transition-colors duration-300" style={{ color: colors.baseColor }} />
                  <div>
                    <h3
                      className="font-bold text-lg mb-2 transition-colors duration-300"
                      style={{ color: colors.baseColor }}
                    >
                      住所
                    </h3>
                    <p className="text-gray-700">
                      〒101-0045
                      <br />
                      東京都千代田区神田鍛冶町３丁目６−４
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-6 h-6 mt-1 transition-colors duration-300" style={{ color: colors.baseColor }} />
                  <div>
                    <h3
                      className="font-bold text-lg mb-2 transition-colors duration-300"
                      style={{ color: colors.baseColor }}
                    >
                      営業時間
                    </h3>
                    <p className="text-gray-700">11：00 - 23：00　(フードLO22：00)</p>
                    <p className="text-gray-700 mt-1">定休日は平日の火曜日。それ以外のお休みは随時Xでポストします！</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 mt-6">
                  <XIcon className="w-6 h-6 mt-1 transition-colors duration-300" style={{ color: colors.baseColor }} />
                  <div>
                    <h3
                      className="font-bold text-lg mb-2 transition-colors duration-300"
                      style={{ color: colors.baseColor }}
                    >
                      お問い合わせ
                    </h3>
                    <p className="text-gray-700">
                      お問い合わせは
                      <a
                        href="https://x.com/aenbien_pon"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline transition-colors duration-300"
                        style={{ color: colors.baseColor }}
                      >
                        マスターのX
                      </a>
                      まで！
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d620.2246829043711!2d139.7713219394533!3d35.6943858958073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188c0244ae2755%3A0x83ae34ff8a14ca38!2z44CSMTAxLTAwNDUg5p2x5Lqs6YO95Y2D5Luj55Sw5Yy656We55Sw6Y2b5Ya255S677yT5LiB55uu77yW4oiS77yU!5e0!3m2!1sja!2sjp!4v1755235426138!5m2!1sja!2sjp"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Cafe PON - 東京都千代田区神田鍛冶町３丁目６−４"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-4 relative z-10 transition-all duration-300"
        style={{ backgroundColor: `${darkenColor(colors.baseColor, 0.1)}CC` }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a
              href="https://www.instagram.com/cafe_pon_kandakaji3/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Instagram
                className="w-6 h-6"
                style={{ color: colors.baseTextColor }}
              />
            </a>
            <a
              href="https://x.com/aenbien_pon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <XIcon
                className="w-6 h-6"
                style={{ color: colors.baseTextColor }}
              />
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
