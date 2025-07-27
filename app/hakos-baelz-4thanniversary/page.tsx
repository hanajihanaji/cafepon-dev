'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';

// グローバルgtag関数の型定義
declare global {
  function gtag(...args: any[]): void;
}

// YouTube動画IDを抽出する関数
const extractYouTubeVideoId = (url: string): string => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/live\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : '';
};

// YouTubeサムネイル画像URLを取得する関数
const getYouTubeThumbnailUrl = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
};

// 配信データ
const streamData = [
  {
    id: 1,
    title: "≪3D SHOWCASE≫ ƎNOZ N∩Ⅎ ƎH⊥ O⊥ ƎWOϽ˥ƎM #RatIdol3D",
    description: "ハコス・ベールズさんのコンセプトの「自由で楽しい」が詰まっている、魅力たっぷり3Dお披露目配信です！",
    illustration: "image1.jpg",
    youtubeUrl: "https://www.youtube.com/live/Qd5HBpoOIJA?si=RSQp_2icgXiaVmoz",
    colorTheme: "red" as const
  },
  {
    id: 2,
    title: "≪DREAMCATCHER 3D LIVE≫ Hakos Baelz Birthday Celebration 2024! #BaeDay2024",
    description: "うるう年が誕生日なハコス・ベールズさんは、2024年2月29日にデビューしてから初の誕生日を迎えました。たくさんの思いが込められている生誕3Dライブを是非見てください！",
    illustration: "image2.jpg",
    youtubeUrl: "https://www.youtube.com/live/TQSikoeVXoE?si=APHMo_PoRcyWPKvm",
    colorTheme: "orange" as const
  },
  {
    id: 3,
    title: "≪3D PERFORMANCE LIVE≫ #CHU2BAE",
    description: "「厨二病」がコンセプトの3Dライブです！台詞パートの演技力にぜひ注目を！",
    illustration: "image3.jpg",
    youtubeUrl: "https://www.youtube.com/live/zZhyeaw148k?si=0U7FGlD026NxDqyy",
    colorTheme: "pink" as const
  },
  {
    id: 4,
    title: "≪-KAGURA- Dance of the Gods 3D LIVE≫ Hakos Baelz Birthday 2025 ＋ ANNOUNCEMENTS!",
    description: "「和風がテーマだし日本時間の夜にライブするよ！」というこだわりをご自身で語っておりました。2025年の生誕3Dライブです！",
    illustration: "image4.jpg",
    youtubeUrl: "https://www.youtube.com/live/viPlIHvk724?si=FISE4xQeKhLHjHI2",
    colorTheme: "coral" as const
  },
  {
    id: 5,
    title: "≪BAE-CADEMY≫ Telephone Game!! ft HoloEN・HoloID・HoloJP",
    description: "「JDON MY SOUL とは？」全てはこの配信から始まりました。",
    illustration: "image5.jpg",
    youtubeUrl: "https://www.youtube.com/live/J_q-OWjlt0I?si=Yvo9ViX19KWyptJQ",
    colorTheme: "purple" as const
  },
  {
    id: 6,
    title: "≪KARAOKE・歌枠≫ Hakos Baelz One Million Endurance || １００万耐久配信!!! #BaeMillion",
    description: "まだ見ていない方は100万人突破の瞬間を是非目撃してください！たくさん歌ってくれていますよ♪",
    illustration: "image6.jpg",
    youtubeUrl: "https://www.youtube.com/live/BCCoDqZIUC0?si=4kA_SA5lW1Yu7OJH",
    colorTheme: "crimson" as const
  },
  {
    id: 7,
    title: "≪MARIO KART 8DX≫ DRUNK RACING ft. Roberu #ロベールズ",
    description: "個人的に企画主が「この配信のべ～ちゃんが一番可愛いんじゃないかな」と思ってる配信です 無邪気でいたずらっ子でかわいい",
    illustration: "image7.jpg",
    youtubeUrl: "https://www.youtube.com/live/H7inDv0ghi8?si=5mkarpJ165qwUsHf",
    colorTheme: "red" as const
  }
];

// カラーテーマ定義
const colorThemes = {
  red: {
    background: `
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      radial-gradient(circle at 75% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      linear-gradient(135deg, #fe3a2d 0%, #ff938d 100%)`,
    backgroundSize: '80px 80px, 80px 80px, 100% 100%',
    backgroundPosition: '0 0, 0 40px, 0 0',
    cardBorder: '#ff938d',
    illustrationBorder: '#ff938d',
    shuffleBtn: 'linear-gradient(135deg, #fe3a2d 0%, #ff6b6b 50%, #D72517 100%)',
    shuffleBtnShadow: 'rgba(254, 58, 45, 0.3)'
  },
  orange: {
    background: `
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      radial-gradient(circle at 75% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      linear-gradient(135deg, #ff6b35 0%, #ffab73 100%)`,
    backgroundSize: '80px 80px, 80px 80px, 100% 100%',
    backgroundPosition: '0 0, 0 40px, 0 0',
    cardBorder: '#ffab73',
    illustrationBorder: '#ffab73',
    shuffleBtn: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 50%, #d4541a 100%)',
    shuffleBtnShadow: 'rgba(255, 107, 53, 0.3)'
  },
  pink: {
    background: `
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      radial-gradient(circle at 75% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      linear-gradient(135deg, #ff6b9d 0%, #ffa8cc 100%)`,
    backgroundSize: '80px 80px, 80px 80px, 100% 100%',
    backgroundPosition: '0 0, 0 40px, 0 0',
    cardBorder: '#ffa8cc',
    illustrationBorder: '#ffa8cc',
    shuffleBtn: 'linear-gradient(135deg, #ff6b9d 0%, #ff8fb3 50%, #d15687 100%)',
    shuffleBtnShadow: 'rgba(255, 107, 157, 0.3)'
  },
  coral: {
    background: `
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      radial-gradient(circle at 75% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      linear-gradient(135deg, #ff7675 0%, #fab1a0 100%)`,
    backgroundSize: '80px 80px, 80px 80px, 100% 100%',
    backgroundPosition: '0 0, 0 40px, 0 0',
    cardBorder: '#fab1a0',
    illustrationBorder: '#fab1a0',
    shuffleBtn: 'linear-gradient(135deg, #ff7675 0%, #fd92a0 50%, #e84393 100%)',
    shuffleBtnShadow: 'rgba(255, 118, 117, 0.3)'
  },
  purple: {
    background: `
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      radial-gradient(circle at 75% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      linear-gradient(135deg, #a855f7 0%, #c084fc 100%)`,
    backgroundSize: '80px 80px, 80px 80px, 100% 100%',
    backgroundPosition: '0 0, 0 40px, 0 0',
    cardBorder: '#c084fc',
    illustrationBorder: '#c084fc',
    shuffleBtn: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #7c3aed 100%)',
    shuffleBtnShadow: 'rgba(168, 85, 247, 0.3)'
  },
  crimson: {
    background: `
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      radial-gradient(circle at 75% 25%, rgba(255,255,255,0.25) 2px, transparent 2px),
      linear-gradient(135deg, #dc2626 0%, #f87171 100%)`,
    backgroundSize: '80px 80px, 80px 80px, 100% 100%',
    backgroundPosition: '0 0, 0 40px, 0 0',
    cardBorder: '#f87171',
    illustrationBorder: '#f87171',
    shuffleBtn: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #b91c1c 100%)',
    shuffleBtnShadow: 'rgba(220, 38, 38, 0.3)'
  }
};


export default function HakosBaelzPage() {
  const [currentStream, setCurrentStream] = useState(streamData[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);

  // 初期化
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * streamData.length);
    setCurrentStream(streamData[randomIndex]);
    
    // QRコード経由かURLパラメータで判定
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source') || 'direct';
    
    // GA4でページ流入元を記録
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_entry', {
        'event_category': 'navigation',
        'event_label': source,
        'source_type': source === 'qr' ? 'qr_code' : source === 'direct' ? 'direct_access' : 'other',
        'value': 1
      });
    }
    
    // 2秒後にローディング終了
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 配信シャッフル実行
  const shuffleStream = () => {
    if (isShuffling) return;
    
    setIsShuffling(true);
    setIsLoading(true);
    
    // GA4イベント送信
    if (typeof gtag !== 'undefined') {
      gtag('event', 'stream_shuffle_click', {
        'event_category': 'engagement',
        'event_label': 'stream_shuffle',
        'value': 1
      });
    }
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * streamData.length);
      const newStream = streamData[randomIndex];
      setCurrentStream(newStream);
      
      // GA4イベント送信（シャッフル結果）
      if (typeof gtag !== 'undefined') {
        gtag('event', 'stream_shuffle_result', {
          'event_category': 'engagement',
          'event_label': newStream.title,
          'stream_id': newStream.id,
          'color_theme': newStream.colorTheme,
          'value': 1
        });
      }
      
      setIsLoading(false);
      setIsShuffling(false);
    }, 1500);
  };

  // YouTube遷移
  const goToYoutube = () => {
    // GA4イベント送信
    if (typeof gtag !== 'undefined') {
      gtag('event', 'youtube_button_click', {
        'event_category': 'engagement',
        'event_label': currentStream.title,
        'stream_id': currentStream.id,
        'youtube_url': currentStream.youtubeUrl,
        'value': 1
      });
    }
    
    window.open(currentStream.youtubeUrl, '_blank');
  };

  // 現在のテーマカラー
  const currentTheme = colorThemes[currentStream.colorTheme];

  return (
    <>
      <Head>
        <title>Hakos Baelz 4th Anniversary Cheering Cafe Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-PEMLSDYL0N"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-PEMLSDYL0N');
            `,
          }}
        />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=M+PLUS+Rounded+1c:wght@400;500;700&family=Kosugi+Maru&display=swap" rel="stylesheet" />
      </Head>

      <div 
        className="min-h-screen font-sans"
        style={{
          backgroundImage: currentTheme.background,
          backgroundSize: currentTheme.backgroundSize,
          backgroundPosition: currentTheme.backgroundPosition,
          fontFamily: "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Arial, sans-serif"
        }}
      >
        {/* ローディング画面 */}
        {isLoading && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-500"
            style={{
              backgroundImage: currentTheme.background,
              backgroundSize: currentTheme.backgroundSize,
              backgroundPosition: currentTheme.backgroundPosition
            }}
          >
            <div className="text-center text-white">
              <div className="mb-0">
                <img 
                  src="/hakos-baelz-4thanniversary/assets/logos/logo-color.png" 
                  alt="Hakos Baelz 4th Anniversary Cheering Cafe Project" 
                  className="max-w-xl w-[90%] h-auto mx-auto animate-pulse"
                  style={{
                    filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.4))',
                    animation: 'logoFadeIn 1s ease-out'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        {!isLoading && (
          <div className="min-h-screen flex flex-col">
            {/* ヘッダー */}
            <header className="text-center text-white w-full relative">
              <div className="text-center m-0 relative overflow-visible w-full px-4">
                <img 
                  src="/hakos-baelz-4thanniversary/assets/logos/project-title.png" 
                  alt="Hakos Baelz 4th Anniversary Cheering Cafe Project" 
                  className="w-full max-w-4xl h-auto mx-auto block"
                  style={{filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'}}
                />
              </div>
            </header>

            {/* 配信紹介コンテナ */}
            <main className="flex-1 flex justify-center items-start py-4 px-4">
              <div 
                className="w-full max-w-md p-10 rounded-3xl text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #fef7f7 100%)',
                  boxShadow: `0 15px 35px ${currentTheme.shuffleBtnShadow}, 0 5px 15px rgba(255, 147, 141, 0.2)`,
                  border: `3px solid ${currentTheme.cardBorder}`,
                  animation: isShuffling ? 'none' : 'slideUp 0.6s ease-out'
                }}
              >
                {/* シマー効果 */}
                <div 
                  className="absolute top-0 w-full h-full pointer-events-none"
                  style={{
                    left: '-100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                    animation: 'shimmer 3s infinite'
                  }}
                />

                {/* イラストコンテナ */}
                <div className="mb-6 relative">
                  <div 
                    className="w-full bg-gray-50 rounded-2xl flex justify-center items-center relative overflow-hidden"
                    style={{
                      aspectRatio: '16/9',
                      border: `3px solid ${currentTheme.illustrationBorder}`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <img 
                      src={getYouTubeThumbnailUrl(currentStream.youtubeUrl)}
                      alt={currentStream.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallbackDiv = target.nextElementSibling as HTMLElement;
                        if (fallbackDiv) fallbackDiv.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="absolute inset-0 flex justify-center items-center text-base text-gray-600 text-center z-10 bg-white bg-opacity-80 rounded-lg border border-dashed border-gray-300 m-4"
                      style={{ display: 'none' }}
                    >
                      イラスト #{currentStream.id}
                      <br />
                      <small className="text-sm">{currentStream.illustration}</small>
                    </div>
                  </div>
                  
                  {/* ミニハコスのイラスト（フレームをはみ出して手前に配置） */}
                  <div className="absolute w-20 h-20 z-30" style={{ bottom: '-30px', right: '-30px' }}>
                    <img 
                      src="/images/hakostest.png"
                      alt="Mini Hakos"
                      className="w-full h-full object-contain"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                        transform: 'rotate(-5deg)'
                      }}
                    />
                  </div>
                </div>
                
                {/* 配信情報 */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{currentStream.title}</h3>
                  <p 
                    className="text-base text-gray-700 leading-relaxed font-medium" 
                    style={{
                      fontFamily: "'Fredoka', 'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c', 'Kosugi Maru', 'BIZ UDPGothic', sans-serif",
                      wordBreak: 'keep-all',
                      overflowWrap: 'break-word',
                      lineHeight: '1.6'
                    }}
                  >
                    {currentStream.description}
                  </p>
                </div>

                {/* アクションボタン */}
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={goToYoutube}
                    className="px-10 py-6 rounded-3xl text-lg font-bold cursor-pointer transition-all duration-500 text-white relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #ff0000 0%, #ff4444 50%, #cc0000 100%)',
                      boxShadow: '0 8px 25px rgba(255, 0, 0, 0.3), 0 3px 8px rgba(255, 68, 68, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 0, 0, 0.4), 0 5px 15px rgba(255, 68, 68, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 0, 0, 0.3), 0 3px 8px rgba(255, 68, 68, 0.2)';
                    }}
                  >
                    ▶️ 配信を見に行く！<br />
                    <span className="text-sm font-normal opacity-95 block mt-2">Watch the Stream!</span>
                  </button>

                  <button 
                    onClick={shuffleStream}
                    disabled={isShuffling}
                    className="px-10 py-6 rounded-3xl text-lg font-bold cursor-pointer transition-all duration-500 text-white relative overflow-hidden disabled:opacity-70"
                    style={{
                      background: currentTheme.shuffleBtn,
                      boxShadow: `0 8px 25px ${currentTheme.shuffleBtnShadow}, 0 3px 8px ${currentTheme.shuffleBtnShadow}`,
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isShuffling) {
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 12px 35px ${currentTheme.shuffleBtnShadow}, 0 5px 15px ${currentTheme.shuffleBtnShadow}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isShuffling) {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = `0 8px 25px ${currentTheme.shuffleBtnShadow}, 0 3px 8px ${currentTheme.shuffleBtnShadow}`;
                      }
                    }}
                  >
                    🎲 他の配信も気になる！<br />
                    <span className="text-sm font-normal opacity-95 block mt-2">Want to see other streams!</span>
                  </button>

                  <button 
                    onClick={() => {
                      // GA4イベント送信
                      if (typeof gtag !== 'undefined') {
                        gtag('event', 'survey_button_click', {
                          'event_category': 'engagement',
                          'event_label': 'survey_navigation',
                          'value': 1
                        });
                      }
                      window.open('https://forms.gle/kbcXyxmzYnUE5s9E9', '_blank');
                    }}
                    className="px-10 py-6 rounded-3xl text-lg font-bold cursor-pointer transition-all duration-500 text-white relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #ff938d 0%, #ffb3b3 50%, #ff7a7a 100%)',
                      boxShadow: '0 8px 25px rgba(255, 147, 141, 0.3), 0 3px 8px rgba(255, 179, 179, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 147, 141, 0.4), 0 5px 15px rgba(255, 179, 179, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 147, 141, 0.3), 0 3px 8px rgba(255, 179, 179, 0.2)';
                    }}
                  >
                    📝 アンケートに答える！<br />
                    <span className="text-sm font-normal opacity-95 block mt-2">Take the Survey!</span>
                  </button>
                </div>
              </div>
            </main>

            {/* フッター */}
            <footer className="text-center p-4 text-white text-sm opacity-80">
            </footer>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes logoFadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        @media (max-width: 480px) {
          .gacha-card {
            padding: 1.5rem;
            margin: 0 0.5rem;
          }
        }
      `}</style>
    </>
  );
}