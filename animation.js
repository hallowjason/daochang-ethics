// ═══════════════════════════════════════════════════════
//  道場倫理與行政倫理 — Animation
//  anim-item stagger 由 style.css 的 CSS transition 處理
//  此檔負責：噪點背景疊加、章節封面裝飾線
// ═══════════════════════════════════════════════════════

// ── 噪點紋理疊加（深色頁增加暖意）──────────────────────
(function addNoiseOverlay() {
  const canvas = document.createElement('canvas');
  canvas.width  = 256;
  canvas.height = 256;
  canvas.style.cssText = [
    'position:fixed', 'inset:0', 'width:100%', 'height:100%',
    'pointer-events:none', 'z-index:999',
    'opacity:0.035', 'mix-blend-mode:overlay'
  ].join(';');

  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255 | 0;
    img.data[i]     = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.body.appendChild(canvas);
})();
