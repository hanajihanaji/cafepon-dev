import { M_PLUS_Rounded_1c, Fredoka, Bubblegum_Sans } from "next/font/google"

// M PLUS Rounded 1c フォントの設定
export const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rounded",
})

// ポップなフォントをGoogle Fontsから設定 - Fredoka（丸くて可愛い）
export const popFont = Fredoka({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pop",
})

// 代替ポップフォント - Bubblegum Sans（バブリーで楽しい）
export const bubbleFont = Bubblegum_Sans({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bubble",
})

// フォールバックとしてシステムフォントを使用
export const fallbackFont = {
  fontFamily: `"Hiragino Maru Gothic ProN", "Rounded Mplus 1c", "Hiragino Sans", "Meiryo", sans-serif`,
}
