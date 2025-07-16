// Character color data
const characterColors = [
  { name: "ときのそら", baseColor: "#0146ea", accentColor: "#245eff" },
  { name: "ロボ子さん", baseColor: "#804e7f", accentColor: "#a36694" },
  { name: "さくらみこ", baseColor: "#fe4b74", accentColor: "#ff9cb4" },
  { name: "星街すいせい", baseColor: "#2dcde4", accentColor: "#50e5f9" },
  { name: "AZKi", baseColor: "#d11c76", accentColor: "#f4348b" },
  { name: "夜空メル", baseColor: "#ffc004", accentColor: "#ffdd17" },
  { name: "アキ・ローゼンタール", baseColor: "#dc0485", accentColor: "#ff1c9a" },
  { name: "赤井はあと", baseColor: "#d9062a", accentColor: "#fc123f" },
  { name: "白上フブキ", baseColor: "#53c7ea", accentColor: "#76dfff" },
  { name: "夏色まつり", baseColor: "#ff5606", accentColor: "#ffa227" },
  { name: "湊あくあ", baseColor: "#fe5dd8", accentColor: "#ffa6ea" },
  { name: "紫咲シオン", baseColor: "#8a54cb", accentColor: "#ad6ce0" },
  { name: "百鬼あやめ", baseColor: "#ca223a", accentColor: "#ed3a4f" },
  { name: "癒月ちょこ", baseColor: "#dc5686", accentColor: "#ff6e9b" },
  { name: "大空スバル", baseColor: "#bde717", accentColor: "#e0ff2c" },
  { name: "大神ミオ", baseColor: "#dc1935", accentColor: "#ff314a" },
  { name: "猫又おかゆ", baseColor: "#bf65e8", accentColor: "#e27dfd" },
  { name: "戌神ころね", baseColor: "#dcb414", accentColor: "#ffcc29" },
  { name: "兎田ぺこら", baseColor: "#65baea", accentColor: "#88d2ff" },
  { name: "潤羽るしあ", baseColor: "#0de1bd", accentColor: "#30f9d2" },
  { name: "不知火フレア", baseColor: "#dc3813", accentColor: "#ff5028" },
  { name: "白銀ノエル", baseColor: "#89939d", accentColor: "#acabb2" },
  { name: "宝鐘マリン", baseColor: "#a72413", accentColor: "#ca3c28" },
  { name: "天音かなた", baseColor: "#76c0ea", accentColor: "#99d8ff" },
  { name: "桐生ココ", baseColor: "#db7311", accentColor: "#fe8b04" },
  { name: "角巻わため", baseColor: "#dbda89", accentColor: "#fff29e" },
  { name: "常闇トワ", baseColor: "#a7a2ea", accentColor: "#cabaff" },
  { name: "姫森ルーナ", baseColor: "#db6cad", accentColor: "#fe84c2" },
  { name: "雪花ラミィ", baseColor: "#48b5e3", accentColor: "#6bcdf8" },
  { name: "桃鈴ねね", baseColor: "#fe7a0f", accentColor: "#ffb65d" },
  { name: "獅白ぼたん", baseColor: "#5fcfa6", accentColor: "#a3e5cf" },
  { name: "尾丸ポルカ", baseColor: "#ab0808", accentColor: "#cf2830" },
  { name: "ラプラス・ダークネス", baseColor: "#441495", accentColor: "#936cc6" },
  { name: "鷹嶺ルイ", baseColor: "#28040d", accentColor: "#831550" },
  { name: "博衣こより", baseColor: "#fe68ad", accentColor: "#ffacd3" },
  { name: "沙花叉クロヱ", baseColor: "#ab0e0c", accentColor: "#cf4c4a" },
  { name: "風真いろは", baseColor: "#44bfb7", accentColor: "#93dcd8" },
  { name: "友人A", baseColor: "#565789", accentColor: "#36398c" },
  { name: "春先のどか", baseColor: "#bdf0c3", accentColor: "#deffc9" },
  { name: "Ayunda Risu", baseColor: "#ef8381", accentColor: "#f6bbbb" },
  { name: "Moona Hoshinova", baseColor: "#784dbe", accentColor: "#b19ddc" },
  { name: "Airani Iofifteen", baseColor: "#7bdf0e", accentColor: "#b3ee55" },
  { name: "Kureiji Ollie", baseColor: "#b7030e", accentColor: "#d60e54" },
  { name: "Anya Melfissa", baseColor: "#e89c0f", accentColor: "#f2c95c" },
  { name: "Pavolia Reine", baseColor: "#040f7f", accentColor: "#0f52ba" },
  { name: "Vestia Zeta", baseColor: "#97a1ae", accentColor: "#bab9c3" },
  { name: "Kaela Kovalskia", baseColor: "#dc2528", accentColor: "#ff3d3d" },
  { name: "Kobo Kanaeru", baseColor: "#161c4f", accentColor: "#393464" },
  { name: "Mori Calliope", baseColor: "#a1020b", accentColor: "#c90d40" },
  { name: "Takanashi Kiara", baseColor: "#dc3907", accentColor: "#ff511c" },
  { name: "Ninomae Ina'nis", baseColor: "#3f3e69", accentColor: "#62567e" },
  { name: "Gawr Gura", baseColor: "#3a69b2", accentColor: "#5d81c7" },
  { name: "Watson Amelia", baseColor: "#f2bd36", accentColor: "#f8db92" },
  { name: "IRyS", baseColor: "#991150", accentColor: "#e10e5b" },
  { name: "Tsukumo Sana", baseColor: "#d583ab", accentColor: "#e7bbd2" },
  { name: "Ceres Fauna", baseColor: "#33ca66", accentColor: "#b4e4c7" },
  { name: "Ouro Kronii", baseColor: "#1d1797", accentColor: "#6879c7" },
  { name: "Nanashi Mumei", baseColor: "#c29371", accentColor: "#dcc4b2" },
  { name: "Hakos Baelz", baseColor: "#fe3a2d", accentColor: "#ff938d" },
  { name: "Shiori Novella", baseColor: "#8c80ae", accentColor: "#b8a0cd" },
  { name: "Koseki Bijou", baseColor: "#4b43df", accentColor: "#6e5bf4" },
  { name: "Nerissa Ravencroft", baseColor: "#1e27ac", accentColor: "#2233fb" },
  { name: "Fuwawa Abyssgard", baseColor: "#2d87f7", accentColor: "#67b2ff" },
  { name: "Mococo Abyssgard", baseColor: "#ff82c9", accentColor: "#f7a6ca" },
  { name: "Elizabeth Rose Bloodflame", baseColor: "#97303a", accentColor: "#c7383b" },
  { name: "Gigi Murin", baseColor: "#cd9328", accentColor: "#fdb440" },
  { name: "Cecilia Immergreen", baseColor: "#137a42", accentColor: "#119a5c" },
  { name: "Raora Panthera", baseColor: "#e75786", accentColor: "#f087a9" },
  { name: "火威青", baseColor: "#16264b", accentColor: "#1d3467" },
  { name: "音乃瀬奏", baseColor: "#f6c663", accentColor: "#ffe7b5" },
  { name: "一条莉々華", baseColor: "#ee558b", accentColor: "#f47da9" },
  { name: "儒烏風亭らでん", baseColor: "#1c5e4f", accentColor: "#3c7c71" },
  { name: "轟はじめ", baseColor: "#9293fe", accentColor: "#b6b9ff" },
  { name: "響咲リオナ", baseColor: "#c92654", accentColor: "#fe3480" },
  { name: "虎金妃笑虎", baseColor: "#f25e11", accentColor: "#f58017" },
  { name: "水宮枢", baseColor: "#64cce4", accentColor: "#71e5ff" },
  { name: "輪堂千速", baseColor: "#2c8c8b", accentColor: "#37baba" },
  { name: "綺々羅々ヴィヴィ", baseColor: "#e34899", accentColor: "#eb85bc" },
]

// Special dates mapping
const specialDates: { [key: string]: string } = {
  "01/06": "Watson Amelia",
  "01/12": "兎田ぺこら",
  "01/15": "Ayunda Risu",
  "01/22": "潤羽るしあ",
  "01/30": "尾丸ポルカ",
  "02/01": "Fuwawa Abyssgard",
  "02/02": "Mococo Abyssgard",
  "02/04": "儒烏風亭らでん",
  "02/14": "癒月ちょこ",
  "02/15": "Moona Hoshinova",
  "02/17": "アキ・ローゼンタール",
  "02/22": "猫又おかゆ",
  "02/27": "火威青",
  "02/29": "Hakos Baelz",
  "03/02": "桃鈴ねね",
  "03/05": "さくらみこ",
  "03/07": "IRyS",
  "03/12": "Anya Melfissa",
  "03/14": "Ouro Kronii",
  "03/15": "博衣こより",
  "03/21": "Ceres Fauna",
  "03/22": "星街すいせい",
  "04/02": "不知火フレア",
  "04/04": "Mori Calliope",
  "04/14": "Koseki Bijou",
  "04/20": "音乃瀬奏",
  "04/22": "天音かなた",
  "04/25": "Elizabeth Rose Bloodflame",
  "05/02": "Shiori Novella",
  "05/07": "春先のどか",
  "05/11": "Raora Panthera",
  "05/12": "一条莉々華",
  "05/15": "ときのそら",
  "05/18": "沙花叉クロヱ",
  "05/20": "Ninomae Ina'nis",
  "05/23": "ロボ子さん",
  "05/25": "ラプラス・ダークネス",
  "05/29": "響咲リオナ",
  "06/06": "角巻わため",
  "06/07": "轟はじめ",
  "06/10": "Tsukumo Sana",
  "06/11": "鷹嶺ルイ",
  "06/16": "水宮枢",
  "06/17": "桐生ココ",
  "06/18": "風真いろは",
  "06/20": "Gawr Gura",
  "07/01": "AZKi",
  "07/02": "大空スバル",
  "07/06": "Takanashi Kiara",
  "07/08": "輪堂千速",
  "07/15": "Airani Iofifteen",
  "07/22": "夏色まつり",
  "07/25": "虎金妃笑虎",
  "07/30": "宝鐘マリン",
  "08/04": "Nanashi Mumei",
  "08/08": "常闇トワ",
  "08/10": "赤井はあと",
  "08/20": "大神ミオ",
  "08/27": "綺々羅々ヴィヴィ",
  "08/30": "Kaela Kovalskia",
  "09/08": "獅白ぼたん",
  "09/09": "Pavolia Reine",
  "10/01": "戌神ころね",
  "10/05": "白上フブキ",
  "10/10": "姫森ルーナ",
  "10/13": "Kureiji Ollie",
  "10/18": "Gigi Murin",
  "10/28": "魔乃アロエ",
  "10/31": "夜空メル",
  "11/07": "Vestia Zeta",
  "11/11": "Cecilia Immergreen",
  "11/15": "雪花ラミィ",
  "11/21": "Nerissa Ravencroft",
  "11/24": "白銀ノエル",
  "12/01": "湊あくあ",
  "12/08": "紫咲シオン",
  "12/10": "YAGOO",
  "12/12": "Kobo Kanaeru",
  "12/13": "百鬼あやめ",
}

/**
 * 日本時間（JST）の現在日時を取得する関数
 */
function getJapanTime(): Date {
  // 日本時間（Asia/Tokyo）で現在時刻を取得
  const now = new Date()
  const japanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }))
  return japanTime
}

export function getColorScheme() {
  // 日本時間を基準にする
  const today = getJapanTime()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const dateKey = `${month}/${day}`

  // Check if today is a special date
  const specialCharacter = specialDates[dateKey]

  if (specialCharacter) {
    // Find the character's colors
    const character = characterColors.find((char) => char.name === specialCharacter)
    if (character) {
      return {
        baseColor: character.baseColor,
        accentColor: character.accentColor,
        characterName: character.name,
        isSpecialDate: true,
        currentDate: dateKey,
      }
    }
  }

  // If not a special date, return a random character's colors
  const randomIndex = Math.floor(Math.random() * characterColors.length)
  const randomCharacter = characterColors[randomIndex]

  return {
    baseColor: randomCharacter.baseColor,
    accentColor: randomCharacter.accentColor,
    characterName: randomCharacter.name,
    isSpecialDate: false,
    currentDate: dateKey,
  }
}

/**
 * デバッグ用：現在の日本時間と特別な日付を確認する関数
 */
export function getDebugInfo() {
  const japanTime = getJapanTime()
  const month = String(japanTime.getMonth() + 1).padStart(2, "0")
  const day = String(japanTime.getDate()).padStart(2, "0")
  const dateKey = `${month}/${day}`

  return {
    japanTime: japanTime.toISOString(),
    localTime: new Date().toISOString(),
    dateKey,
    isSpecialDate: !!specialDates[dateKey],
    specialCharacter: specialDates[dateKey] || null,
  }
}
