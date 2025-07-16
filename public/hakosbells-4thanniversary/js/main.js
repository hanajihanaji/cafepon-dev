console.log('main.js loaded - VERSION 2.0');

// ガチャデータ（プレースホルダー）
const gachaData = [
    {
        id: 1,
        title: "おすすめ配信タイトル",
        description: "配信の説明文がここに入ります",
        illustration: "placeholder1.jpg",
        youtubeUrl: "https://www.youtube.com/watch?v=s66rF4tstI4",
        colorTheme: "red"
    },
    {
        id: 2,
        title: "おすすめ配信タイトル", 
        description: "配信の説明文がここに入ります",
        illustration: "placeholder2.jpg",
        youtubeUrl: "https://www.youtube.com/watch?v=s66rF4tstI4",
        colorTheme: "orange"
    },
    {
        id: 3,
        title: "おすすめ配信タイトル",
        description: "配信の説明文がここに入ります",
        illustration: "placeholder3.jpg", 
        youtubeUrl: "https://www.youtube.com/watch?v=s66rF4tstI4",
        colorTheme: "pink"
    },
    {
        id: 4,
        title: "おすすめ配信タイトル",
        description: "配信の説明文がここに入ります",
        illustration: "placeholder4.jpg",
        youtubeUrl: "https://www.youtube.com/watch?v=s66rF4tstI4",
        colorTheme: "coral"
    },
    {
        id: 5,
        title: "おすすめ配信タイトル",
        description: "配信の説明文がここに入ります",
        illustration: "placeholder5.jpg",
        youtubeUrl: "https://www.youtube.com/watch?v=s66rF4tstI4",
        colorTheme: "coral"
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
        gachaBtn: 'linear-gradient(135deg, #fe3a2d 0%, #ff6b6b 50%, #D72517 100%)',
        gachaBtnShadow: 'rgba(254, 58, 45, 0.3)'
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
        gachaBtn: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 50%, #d4541a 100%)',
        gachaBtnShadow: 'rgba(255, 107, 53, 0.3)'
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
        gachaBtn: 'linear-gradient(135deg, #ff6b9d 0%, #ff8fb3 50%, #d15687 100%)',
        gachaBtnShadow: 'rgba(255, 107, 157, 0.3)'
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
        gachaBtn: 'linear-gradient(135deg, #ff7675 0%, #fd92a0 50%, #e84393 100%)',
        gachaBtnShadow: 'rgba(255, 118, 117, 0.3)'
    }
};

let currentGacha = null;

// ランダムガチャ実行
function executeGacha() {
    // ローディング画面表示
    showLoadingScreen();
    
    // 1.5秒後にガチャ結果表示
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * gachaData.length);
        currentGacha = gachaData[randomIndex];
        
        // UI更新
        updateGachaDisplay(currentGacha);
        
        // ローディング画面を隠してメインコンテンツ表示
        hideLoadingScreen();
        
        // ガチャ演出
        playGachaAnimation();
    }, 1500);
}

// ガチャ表示更新
function updateGachaDisplay(gacha) {
    const illustrationEl = document.getElementById('gacha-illustration');
    const titleEl = document.getElementById('gacha-title');
    const descriptionEl = document.getElementById('gacha-description');
    
    // プレースホルダーイラスト表示
    illustrationEl.innerHTML = `
        <div class="placeholder-text">
            イラスト #${gacha.id}
            <br>
            <small>${gacha.illustration}</small>
        </div>
    `;
    
    titleEl.textContent = gacha.title;
    descriptionEl.textContent = gacha.description;
    
    // テーマカラー適用
    applyColorTheme(gacha.colorTheme);
}

// カラーテーマ適用
function applyColorTheme(theme) {
    console.log('applyColorTheme called with theme:', theme);
    const colors = colorThemes[theme];
    console.log('Theme colors:', colors);
    
    const body = document.body;
    const loadingScreen = document.getElementById('loading-screen');
    const gachaCard = document.querySelector('.gacha-card');
    const illustrationPlaceholder = document.querySelector('.illustration-placeholder');
    const gachaBtn = document.getElementById('gacha-btn');
    
    console.log('Elements found:', {
        body: !!body,
        loadingScreen: !!loadingScreen,
        gachaCard: !!gachaCard,
        illustrationPlaceholder: !!illustrationPlaceholder,
        gachaBtn: !!gachaBtn
    });
    
    // 背景を直接変更
    if (body) {
        body.style.background = colors.background;
        body.style.backgroundSize = colors.backgroundSize;
        body.style.backgroundPosition = colors.backgroundPosition;
        console.log('Body background applied:', colors.background);
    }
    
    if (loadingScreen) {
        loadingScreen.style.background = colors.background;
        loadingScreen.style.backgroundSize = colors.backgroundSize;
        loadingScreen.style.backgroundPosition = colors.backgroundPosition;
        console.log('Loading screen background applied');
    }
    
    // カード枠線変更
    if (gachaCard) {
        gachaCard.style.borderColor = colors.cardBorder;
        console.log('Card border applied');
    }
    
    // イラスト枠線変更
    if (illustrationPlaceholder) {
        illustrationPlaceholder.style.borderColor = colors.illustrationBorder;
        console.log('Illustration border applied');
    }
    
    // ガチャボタン色変更
    if (gachaBtn) {
        gachaBtn.style.background = colors.gachaBtn;
        gachaBtn.style.boxShadow = `
            0 8px 25px ${colors.gachaBtnShadow},
            0 3px 8px ${colors.gachaBtnShadow}
        `;
        console.log('Gacha button style applied');
    }
}

// ガチャ演出
function playGachaAnimation() {
    const card = document.querySelector('.gacha-card');
    
    // カードをフェードアウト
    card.style.opacity = '0.7';
    card.style.transform = 'scale(0.95)';
    
    // 少し待ってからフェードイン
    setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
        card.style.transition = 'all 0.3s ease';
    }, 200);
}

// YouTube遷移
function goToYoutube() {
    if (!currentGacha) return;
    
    // 直接YouTube遷移（スマホアプリ対応）
    window.open(currentGacha.youtubeUrl, '_blank');
}

// ローディング画面表示/非表示
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    console.log('showLoadingScreen - loadingScreen:', loadingScreen);
    console.log('showLoadingScreen - mainContent:', mainContent);
    
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
        loadingScreen.classList.add('show');
    }
    if (mainContent) {
        mainContent.classList.add('hidden');
        mainContent.classList.remove('show');
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    console.log('hideLoadingScreen - loadingScreen:', loadingScreen);
    console.log('hideLoadingScreen - mainContent:', mainContent);
    
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        loadingScreen.classList.remove('show');
    }
    if (mainContent) {
        mainContent.classList.remove('hidden');
        mainContent.classList.add('show');
    }
}

// 初期化
function init() {
    console.log('Init function started');
    
    // 初回ガチャ選択（表示前に実行）
    const randomIndex = Math.floor(Math.random() * gachaData.length);
    currentGacha = gachaData[randomIndex];
    console.log('Selected initial gacha:', currentGacha);
    
    // テーマを事前に適用
    applyColorTheme(currentGacha.colorTheme);
    
    // 常にローディング画面を表示（初回・リロード問わず）
    showLoadingScreen();
    console.log('Loading screen shown');
    
    // 2秒後にメインコンテンツを表示
    setTimeout(() => {
        console.log('Timeout triggered - switching to main content');
        
        // ガチャ表示更新
        updateGachaDisplay(currentGacha);
        
        hideLoadingScreen();
        console.log('Loading screen hidden, main content shown');
        
        playGachaAnimation();
    }, 2000);
    
    // イベントリスナー設定
    try {
        document.getElementById('gacha-btn').addEventListener('click', executeGacha);
        document.getElementById('youtube-btn').addEventListener('click', goToYoutube);
        console.log('Event listeners attached');
    } catch (error) {
        console.error('Error attaching event listeners:', error);
    }
}

// ページ読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded triggered');
    init();
});