import type React from "react"
import type { Metadata } from "next"
import { mPlusRounded, popFont, bubbleFont } from "@/lib/fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: "Cafe PON",
  description: "推しと、いっしょに。Cafe PON",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${mPlusRounded.variable} ${popFont.variable} ${bubbleFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}
