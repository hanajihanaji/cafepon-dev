import type { FC } from "react"

interface BackgroundPatternProps {
  baseColor: string
  accentColor: string
}

export const BackgroundPattern: FC<BackgroundPatternProps> = ({ baseColor, accentColor }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {/* SVG Pattern Layer */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 流星風の丸っこいライン */}
          <pattern id="meteor-lines" x="0" y="0" width="300" height="200" patternUnits="userSpaceOnUse">
            {/* メインの流星ライン */}
            <path
              d="M50,150 Q100,120 150,90 Q200,60 250,30"
              stroke={accentColor}
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M20,180 Q70,150 120,120 Q170,90 220,60"
              stroke={baseColor}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              opacity="0.25"
            />
            <path
              d="M80,170 Q130,140 180,110 Q230,80 280,50"
              stroke={accentColor}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.2"
            />

            {/* 小さな流星ライン */}
            <path
              d="M10,120 Q40,100 70,80"
              stroke={accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.15"
            />
            <path
              d="M180,160 Q210,140 240,120"
              stroke={baseColor}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.15"
            />
          </pattern>

          {/* 丸い角の左向き三角形パターン（数を大幅に減らす） */}
          <pattern id="rounded-triangles" x="0" y="0" width="400" height="300" patternUnits="userSpaceOnUse">
            {/* 大きな丸い角の左向き三角形（1つだけ） */}
            <path d="M120,75 L80,50 Q75,48 72,53 L72,97 Q75,102 80,100 L120,75 Z" fill={accentColor} opacity="0.25" />

            {/* 中サイズの丸い角の左向き三角形（1つだけ） */}
            <path
              d="M300,200 L280,190 Q277,189 275,192 L275,208 Q277,211 280,210 L300,200 Z"
              fill={baseColor}
              opacity="0.20"
            />
          </pattern>

          {/* ドットパターン（控えめに） */}
          <pattern id="soft-dots" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="60" cy="60" r="5" fill={accentColor} opacity="0.08" />
            <circle cx="20" cy="20" r="3" fill={baseColor} opacity="0.06" />
            <circle cx="100" cy="100" r="3" fill={accentColor} opacity="0.06" />
            <circle cx="30" cy="90" r="2" fill={baseColor} opacity="0.05" />
            <circle cx="90" cy="30" r="2" fill={accentColor} opacity="0.05" />
          </pattern>
        </defs>

        {/* パターンを適用 */}
        <rect width="100%" height="100%" fill="url(#meteor-lines)" />
        <rect width="100%" height="100%" fill="url(#rounded-triangles)" />
        <rect width="100%" height="100%" fill="url(#soft-dots)" />

        {/* 追加の流星ライン（大きなもの） */}
        <g opacity="0.12">
          <path
            d="M0,600 Q200,500 400,400 Q600,300 800,200"
            stroke={accentColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100,700 Q300,600 500,500 Q700,400 900,300"
            stroke={baseColor}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-100,800 Q100,700 300,600 Q500,500 700,400"
            stroke={accentColor}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* 散らばった少数の丸い角の左向き三角形 */}
        <g opacity="0.18">
          {/* 大きな左向き三角形（3つのみ） */}
          <path
            d="M300,190 L200,140 Q190,136 185,145 L185,235 Q190,244 200,240 L300,190 Z"
            fill={accentColor}
            opacity="0.7"
          />
          <path
            d="M900,240 L800,190 Q790,186 785,195 L785,285 Q790,294 800,290 L900,240 Z"
            fill={baseColor}
            opacity="0.6"
          />
          <path
            d="M500,450 L430,413 Q423,410 419,417 L419,483 Q423,490 430,487 L500,450 Z"
            fill={accentColor}
            opacity="0.7"
          />

          {/* 中サイズの左向き三角形（2つのみ） */}
          <path
            d="M150,350 L130,340 Q127,339 125,342 L125,358 Q127,361 130,360 L150,350 Z"
            fill={baseColor}
            opacity="0.5"
          />
          <path
            d="M750,500 L730,490 Q727,489 725,492 L725,508 Q727,511 730,510 L750,500 Z"
            fill={accentColor}
            opacity="0.5"
          />
        </g>

        {/* キラキラ効果（小さな丸） */}
        <g opacity="0.06">
          <circle cx="150" cy="250" r="8" fill={accentColor} />
          <circle cx="350" cy="200" r="6" fill={baseColor} />
          <circle cx="650" cy="300" r="7" fill={accentColor} />
          <circle cx="850" cy="450" r="5" fill={baseColor} />
          <circle cx="500" cy="550" r="6" fill={accentColor} />
          <circle cx="750" cy="650" r="5" fill={baseColor} />
          <circle cx="250" cy="400" r="4" fill={accentColor} />
          <circle cx="950" cy="250" r="5" fill={baseColor} />
        </g>
      </svg>
    </div>
  )
}
