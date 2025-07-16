/**
 * 色が明るいか暗いかを判定する関数
 * @param hexColor - 16進数のカラーコード（例: #ff0000）
 * @returns boolean - trueなら明るい色、falseなら暗い色
 */
export function isLightColor(hexColor: string): boolean {
  // #を取り除く
  const hex = hexColor.replace("#", "")

  // 16進数をRGB値に変換
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)

  // 輝度を計算（YIQ式）- 人間の目の感度に合わせた重み付け
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  // 輝度が128.5以上なら明るい色、それ以下なら暗い色と判定
  return yiq >= 128.5
}

/**
 * 背景色に基づいて適切なテキスト色を返す関数
 * @param bgColor - 背景色の16進数カラーコード
 * @returns string - 適切なテキスト色（黒または白）
 */
export function getContrastTextColor(bgColor: string): string {
  return isLightColor(bgColor) ? "#000000" : "#ffffff"
}

/**
 * 色を暗くする関数
 * @param hexColor - 16進数のカラーコード
 * @param amount - 暗くする量（0〜1）
 * @returns string - 暗くした色の16進数カラーコード
 */
export function darkenColor(hexColor: string, amount = 0.2): string {
  // #を取り除く
  const hex = hexColor.replace("#", "")

  // 16進数をRGB値に変換
  let r = Number.parseInt(hex.substring(0, 2), 16)
  let g = Number.parseInt(hex.substring(2, 4), 16)
  let b = Number.parseInt(hex.substring(4, 6), 16)

  // 各色を指定された量だけ暗くする
  r = Math.max(0, Math.floor(r * (1 - amount)))
  g = Math.max(0, Math.floor(g * (1 - amount)))
  b = Math.max(0, Math.floor(b * (1 - amount)))

  // RGB値を16進数に戻す
  const darkR = r.toString(16).padStart(2, "0")
  const darkG = g.toString(16).padStart(2, "0")
  const darkB = b.toString(16).padStart(2, "0")

  return `#${darkR}${darkG}${darkB}`
}

/**
 * 色を明るくする関数
 * @param hexColor - 16進数のカラーコード
 * @param amount - 明るくする量（0〜1）
 * @returns string - 明るくした色の16進数カラーコード
 */
export function lightenColor(hexColor: string, amount = 0.2): string {
  // #を取り除く
  const hex = hexColor.replace("#", "")

  // 16進数をRGB値に変換
  let r = Number.parseInt(hex.substring(0, 2), 16)
  let g = Number.parseInt(hex.substring(2, 4), 16)
  let b = Number.parseInt(hex.substring(4, 6), 16)

  // 各色を指定された量だけ明るくする
  r = Math.min(255, Math.floor(r + (255 - r) * amount))
  g = Math.min(255, Math.floor(g + (255 - g) * amount))
  b = Math.min(255, Math.floor(b + (255 - b) * amount))

  // RGB値を16進数に戻す
  const lightR = r.toString(16).padStart(2, "0")
  const lightG = g.toString(16).padStart(2, "0")
  const lightB = b.toString(16).padStart(2, "0")

  return `#${lightR}${lightG}${lightB}`
}
