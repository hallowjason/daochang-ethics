// ═══════════════════════════════════════════════════════
//  道場倫理與行政倫理 — Navigation
//  響應式三層策略：
//    ≥1024px  Desktop  — canvas 翻頁模式
//    768–1023 Tablet   — transform:scale 縮放 canvas
//    <768px   Mobile   — CSS reflow 捲動閱讀模式
// ═══════════════════════════════════════════════════════

// ── 初始化（等待 slides-ready 事件）───────────────────
document.addEventListener('slides-ready', initPresentation);

function initPresentation() {

// ── 套用 zoom（從 content.json meta 讀取）────────────────
const zoom = window.PRESENTATION_META?.zoom;
if (zoom && zoom !== 1) {
  document.documentElement.style.zoom = String(zoom);
}

const slides      = Array.from(document.querySelectorAll('.slide'));
const total       = slides.length;
let current       = 0;
let isTransitioning = false;

const progressBar  = document.getElementById('progress-bar');
const slideCounter = document.getElementById('slide-counter');

function pad(n) { return String(n).padStart(2, '0'); }
function isMobile()  { return window.innerWidth < 768; }
function isTablet()  { return window.innerWidth >= 768 && window.innerWidth < 1024; }

// ── Tablet 縮放 ──────────────────────────────────────────
const DESIGN_W = 1200;
const DESIGN_H = 675;

function applyScale() {
  const pres = document.querySelector('.presentation');
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (w >= 1024) {
    pres.style.width          = '';
    pres.style.height         = '';
    pres.style.transform      = '';
    pres.style.transformOrigin = '';
    pres.style.left           = '';
    pres.style.top            = '';
    pres.style.position       = '';
  } else if (w >= 768) {
    const scale = Math.min(w / DESIGN_W, h / DESIGN_H);
    pres.style.position       = 'fixed';
    pres.style.width          = DESIGN_W + 'px';
    pres.style.height         = DESIGN_H + 'px';
    pres.style.transformOrigin = 'top left';
    pres.style.transform      = `scale(${scale})`;
    pres.style.left           = ((w - DESIGN_W * scale) / 2) + 'px';
    pres.style.top            = '0px';
  }
}

window.addEventListener('resize', applyScale);
applyScale();

// ── Slide 切換 ───────────────────────────────────────────
function goToSlide(idx) {
  if (isMobile()) return;
  if (idx < 0 || idx >= total || isTransitioning) return;
  isTransitioning = true;

  try {
    const prevSlide = slides[current];
    const nextSlide = slides[idx];

    // Stack 頁離開時重置
    if (prevSlide.classList.contains('slide-stack')) {
      resetStack(prevSlide);
    }

    prevSlide.classList.remove('active');
    current = idx;
    nextSlide.classList.add('active');

    // 重啟 anim-item 動畫
    const animItems = nextSlide.querySelectorAll('.anim-item');
    animItems.forEach(el => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(18px)';
    });
    nextSlide.offsetHeight; // force reflow
    animItems.forEach(el => {
      el.style.opacity   = '';
      el.style.transform = '';
    });

    // Stack 頁進入時初始化
    if (nextSlide.classList.contains('slide-stack')) {
      initStack(nextSlide);
    }

    // Firebase 互動頁：生成 QR Code
    if (nextSlide.classList.contains('slide-interactive')) {
      initInteractivePage(nextSlide);
    }

    // 更新進度條 & 計數器
    const pct = (current / (total - 1)) * 100;
    if (progressBar) progressBar.style.width = pct + '%';
    if (slideCounter) slideCounter.textContent = pad(current + 1) + ' / ' + pad(total);

    updateNavDots(idx);
  } finally {
    setTimeout(() => { isTransitioning = false; }, 650);
  }
}

function next() { if (!isTransitioning) goToSlide(current + 1); }
function prev() { if (!isTransitioning) goToSlide(current - 1); }

// ── 按鈕 ─────────────────────────────────────────────────
const btnNext = document.getElementById('btn-next');
const btnPrev = document.getElementById('btn-prev');
if (btnNext) btnNext.addEventListener('click', next);
if (btnPrev) btnPrev.addEventListener('click', prev);

// ── 鍵盤 ─────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (document.querySelector('[contenteditable="true"]')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prev();
});

// ── Wheel ────────────────────────────────────────────────
let wheelDebounce = false;
document.addEventListener('wheel', e => {
  if (isMobile()) return;
  if (wheelDebounce) return;
  wheelDebounce = true;
  if (e.deltaY > 0) next(); else prev();
  setTimeout(() => { wheelDebounce = false; }, 350);
}, { passive: true });

// ── Touch swipe（Tablet only）────────────────────────────
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  if (isMobile()) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dy) > Math.abs(dx)) return;
  if (Math.abs(dx) < 50) return;
  if (dx < 0) next(); else prev();
}, { passive: true });

// ── 底部 Nav Panel ────────────────────────────────────────
const slideNavPanel   = document.getElementById('slide-nav-panel');
const slideNavTrigger = document.getElementById('slide-nav-trigger');

if (slideNavPanel && slideNavTrigger) {
  let navHideTimer;
  const showNav = () => { clearTimeout(navHideTimer); slideNavPanel.classList.add('visible'); };
  const hideNav = () => { navHideTimer = setTimeout(() => slideNavPanel.classList.remove('visible'), 400); };

  slideNavTrigger.addEventListener('mouseenter', showNav);
  slideNavTrigger.addEventListener('mouseleave', hideNav);
  slideNavPanel.addEventListener('mouseenter', showNav);
  slideNavPanel.addEventListener('mouseleave', hideNav);

  const navDots = [];
  const frag = document.createDocumentFragment();
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.dataset.num = pad(i + 1);
    dot.addEventListener('click', () => goToSlide(i));
    navDots.push(dot);
    frag.appendChild(dot);
  });
  slideNavPanel.appendChild(frag);

  window.updateNavDots = function(idx) {
    navDots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
  };
}

function updateNavDots(idx) {
  if (window.updateNavDots) window.updateNavDots(idx);
}

// ═══════════════════════════════════════════════════════
//  STACK 動畫（前賢列表，slide #14）
// ═══════════════════════════════════════════════════════
const RANDOM_ROTATIONS = [-4, 2, -2, 5, -3, 1, 4, -1, 3, -5, 2, -3];

function initStack(slideEl) {
  const cards = Array.from(slideEl.querySelectorAll('.stack-card'));
  // 全部先隱藏
  cards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = `rotate(${RANDOM_ROTATIONS[i % RANDOM_ROTATIONS.length]}deg) translateY(30px)`;
    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    card.dataset.revealed = 'false';
  });
  slideEl.dataset.stackIdx = '0';

  // 點擊揭露下一張
  slideEl._stackHandler = function(e) {
    revealNextCard(slideEl);
  };
  slideEl.addEventListener('click', slideEl._stackHandler);
}

function revealNextCard(slideEl) {
  const cards = Array.from(slideEl.querySelectorAll('.stack-card'));
  const nextIdx = parseInt(slideEl.dataset.stackIdx || '0');

  if (nextIdx >= cards.length) return;

  const card = cards[nextIdx];
  card.style.opacity   = '1';
  card.style.transform = `rotate(${RANDOM_ROTATIONS[nextIdx % RANDOM_ROTATIONS.length]}deg) translateY(0)`;
  card.dataset.revealed = 'true';
  slideEl.dataset.stackIdx = String(nextIdx + 1);

  // 所有卡片揭露後隱藏提示
  if (nextIdx + 1 >= cards.length) {
    const hint = slideEl.querySelector('.stack-hint');
    if (hint) hint.style.opacity = '0';
  }
}

function resetStack(slideEl) {
  if (slideEl._stackHandler) {
    slideEl.removeEventListener('click', slideEl._stackHandler);
    slideEl._stackHandler = null;
  }
  slideEl.dataset.stackIdx = '0';
  const cards = slideEl.querySelectorAll('.stack-card');
  cards.forEach(card => {
    card.style.opacity = '0';
    card.dataset.revealed = 'false';
  });
  const hint = slideEl.querySelector('.stack-hint');
  if (hint) hint.style.opacity = '1';
}

// ═══════════════════════════════════════════════════════
//  Bingo 互動（slide #22）
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.bingo-cell').forEach(cell => {
  cell.addEventListener('click', () => {
    cell.classList.toggle('filled');
    checkBingo(cell.closest('.bingo-grid'));
  });
});

function checkBingo(grid) {
  if (!grid) return;
  const cells = Array.from(grid.querySelectorAll('.bingo-cell'));
  const filled = cells.map(c => c.classList.contains('filled'));
  // 3x3 grid: check rows, cols, diagonals
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],  // rows
    [0,3,6],[1,4,7],[2,5,8],  // cols
    [0,4,8],[2,4,6]           // diagonals
  ];
  const hasBingo = wins.some(line => line.every(i => filled[i]));
  if (hasBingo) {
    grid.classList.add('bingo-win');
    setTimeout(() => grid.classList.remove('bingo-win'), 2000);
  }
}

// ═══════════════════════════════════════════════════════
//  Firebase 互動頁初始化
// ═══════════════════════════════════════════════════════
let firebaseApp = null;
let db = null;
let firebaseInitialized = false;
const qrGenerated = {};

function ensureFirebase() {
  if (firebaseInitialized) return true;
  try {
    if (typeof firebase === 'undefined' || typeof FIREBASE_CONFIG === 'undefined') return false;
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.apps[0];
    }
    db = firebase.database();
    firebaseInitialized = true;
    return true;
  } catch (e) {
    console.warn('Firebase init failed:', e);
    return false;
  }
}

function initInteractivePage(slideEl) {
  const itype = slideEl.querySelector('[id^="qr-"]');
  if (!itype) return;

  const isWordcloud = slideEl.querySelector('#qr-wordcloud') !== null;
  const isLetter    = slideEl.querySelector('#qr-letter') !== null;

  if (!isWordcloud && !isLetter) return;
  if (!ensureFirebase()) return;

  if (isWordcloud && !qrGenerated['wordcloud']) {
    generateQR('qr-wordcloud', SURVEY_BASE_URL + '?mode=wordcloud');
    qrGenerated['wordcloud'] = true;
    listenWordcloud();
  }

  if (isLetter && !qrGenerated['letter']) {
    generateQR('qr-letter', SURVEY_BASE_URL + '?mode=letter');
    qrGenerated['letter'] = true;
    listenLetters();
  }
}

function generateQR(elementId, url) {
  const el = document.getElementById(elementId);
  if (!el || el.innerHTML.trim() !== '') return;
  if (typeof QRCode === 'undefined') { el.textContent = url; return; }
  new QRCode(el, {
    text: url,
    width: 140,
    height: 140,
    colorDark: '#141413',
    colorLight: '#f5f4ed',
    correctLevel: QRCode.CorrectLevel.M
  });
}

// ── 文字雲監聽 ──────────────────────────────────────────
function listenWordcloud() {
  if (!db) return;
  const display = document.getElementById('wordcloud-display');
  if (!display) return;

  db.ref(DB_PATH_WORDCLOUD).on('value', snapshot => {
    const data = snapshot.val() || {};
    // 統計詞頻
    const wordCount = {};
    Object.values(data).forEach(entry => {
      if (!entry || !entry.words) return;
      entry.words.split(/[,，\s]+/).forEach(w => {
        const word = w.trim();
        if (word.length < 1) return;
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    // 渲染文字雲
    const sorted = Object.entries(wordCount).sort((a,b) => b[1] - a[1]).slice(0, 30);
    const maxCount = sorted[0]?.[1] || 1;
    display.innerHTML = sorted.map(([word, count]) => {
      const size = 14 + Math.round((count / maxCount) * 32);
      const opacity = 0.5 + (count / maxCount) * 0.5;
      return `<span class="wc-word" style="font-size:${size}px;opacity:${opacity}">${word}</span>`;
    }).join('');
  });
}

// ── 信件牆監聽 ─────────────────────────────────────────
function listenLetters() {
  if (!db) return;
  const wall = document.getElementById('letter-wall');
  if (!wall) return;

  db.ref(DB_PATH_LETTERS).on('value', snapshot => {
    const data = snapshot.val() || {};
    const letters = Object.values(data).filter(l => l && l.text);
    wall.innerHTML = letters.slice(-12).map(l => `
      <div class="letter-card">
        <div class="letter-text">${escapeHtml(l.text)}</div>
      </div>
    `).join('');
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── 初始化第一頁 ────────────────────────────────────────
goToSlide(0);

} // end initPresentation
