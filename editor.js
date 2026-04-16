/**
 * editor.js — WYSIWYG 編輯模式
 * 啟動：URL 加 ?edit=true
 *
 * 功能：
 *   - 所有 [data-editable] 元素均可點擊編輯
 *   - 懸停顯示標注泡泡（data-field 名稱）
 *   - 編輯中：方向鍵不觸發換頁、Alt+Enter 插入換行
 *   - 拖移元素右邊緣可調整文字區塊寬度
 *   - 右鍵任意位置 → 加入備注便利貼
 *   - 右下角「💾 匯出」
 */

(function () {
  'use strict';
  if (!new URLSearchParams(location.search).has('edit')) return;

  /* ─────────────────────────────────
     主題配色
  ───────────────────────────────── */
  const THEMES = {
    warm: { label: '市集·暖', emoji: '🟡', vars: { '--yellow': '#FFE000', '--orange': '#F07030', '--red': '#D63020', '--green': '#3A8A4A' } },
    cool: { label: '清晨·藍', emoji: '🔵', vars: { '--yellow': '#E0F0FF', '--orange': '#4080C0', '--red': '#2060A0', '--green': '#208060' } },
    mono: { label: '黑白·極簡', emoji: '⬛', vars: { '--yellow': '#F5F5F5', '--orange': '#666666', '--red': '#333333', '--green': '#444444' } }
  };

  const changes = {};
  const notes = [];   // { id, x, y, text, el }
  let activeTheme = 'warm';
  let noteIdCounter = 0;

  /* ─────────────────────────────────
     工具函式
  ───────────────────────────────── */
  function getSlideIdx(el) {
    const s = el.closest('.slide[data-idx]');
    return s ? s.getAttribute('data-idx') : 'global';
  }

  function makeKey(el) {
    return `s${getSlideIdx(el)}__${el.dataset.field || el.tagName.toLowerCase()}`;
  }

  function fieldLabel(el) {
    const m = {
      title: '標題', subtitle: '副標', tag: '標籤', label: '眉標',
      eyebrow: '眉標', tagline: '金句', headline: '主標', text: '內文',
      closing: '結語', orig0: '原文1', orig1: '原文2', orig2: '原文3',
      plain0: '白話1', plain1: '白話2', plain2: '白話3',
      line0: '第1行', line1: '第2行', line2: '第3行', line3: '第4行',
      line4: '第5行', line5: '第6行', line6: '第7行',
      cardA_source: 'A來源', cardA_preview: 'A預覽',
      cardB_source: 'B來源', cardB_preview: 'B預覽',
      cardC_source: 'C來源', cardC_preview: 'C預覽',
      rule0: '規則1', rule1: '規則2', rule2: '規則3', rule3: '規則4', rule4: '規則5',
      prompt0: '提示1', prompt1: '提示2', prompt2: '提示3',
    };
    return m[el.dataset.field] || el.dataset.field || el.tagName.toLowerCase();
  }

  /* ─────────────────────────────────
     注入樣式
  ───────────────────────────────── */
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      #edit-badge {
        position:fixed; top:10px; left:50%; transform:translateX(-50%);
        background:#D63020; color:#fff; font-family:sans-serif;
        font-size:12px; font-weight:700; padding:4px 16px;
        z-index:9999; pointer-events:none; letter-spacing:1px; text-transform:uppercase;
      }
      [data-editable]:not([contenteditable="true"]):hover {
        outline:2px dashed #F07030 !important; outline-offset:3px; cursor:text !important;
      }
      [data-editable][contenteditable="true"] {
        outline:2px solid #FFE000 !important; background:rgba(255,224,0,0.12) !important;
        min-width:40px; position:relative; z-index:10;
      }
      .edit-bubble {
        position:fixed; background:#111; color:#FFE000;
        font-family:sans-serif; font-size:11px; font-weight:700;
        padding:3px 9px; pointer-events:none; z-index:9998;
        white-space:nowrap; letter-spacing:0.5px;
        opacity:0; transition:opacity 0.15s;
        transform:translateX(-50%) translateY(calc(-100% - 6px));
      }
      .edit-bubble::after {
        content:''; position:absolute; top:100%; left:50%;
        transform:translateX(-50%); border:4px solid transparent; border-top-color:#111;
      }
      .edit-bubble.visible { opacity:1; }

      /* 寬度調整把手 */
      .resize-handle {
        position:absolute; top:0; right:-6px; width:12px; height:100%;
        cursor:ew-resize; z-index:9999; background:rgba(255,224,0,0.5);
        border-right:2px solid #F07030;
        display:none;
      }
      [data-editable]:not([contenteditable="true"]):hover .resize-handle,
      [data-editable][contenteditable="true"] .resize-handle { display:block; }

      /* 右鍵選單 */
      #editor-ctx-menu {
        position:fixed; background:#111; border:2px solid #FFE000;
        min-width:160px; z-index:10000; font-family:sans-serif;
        box-shadow:4px 4px 0 rgba(0,0,0,0.4);
        display:none;
      }
      #editor-ctx-menu.visible { display:block; }
      .ctx-item {
        padding:10px 16px; color:#fff; font-size:13px; cursor:pointer;
        border-bottom:1px solid rgba(255,255,255,0.08);
        transition:background 0.12s;
        user-select:none;
      }
      .ctx-item:last-child { border-bottom:none; }
      .ctx-item:hover { background:rgba(255,224,0,0.2); color:#FFE000; }

      /* 備注便利貼 */
      .sticky-note {
        position:fixed; min-width:180px; max-width:280px;
        background:#FFFDE7; border:2px solid #F9A825;
        box-shadow:3px 3px 0 rgba(0,0,0,0.2);
        z-index:9990; cursor:move; user-select:none;
        font-family:sans-serif;
      }
      .sticky-header {
        background:#F9A825; padding:6px 10px;
        display:flex; align-items:center; justify-content:space-between;
        font-size:11px; font-weight:700; color:#333; cursor:move;
        user-select:none;
      }
      .sticky-header span { opacity:0.7; }
      .sticky-close {
        background:none; border:none; cursor:pointer;
        font-size:14px; line-height:1; color:#333; padding:0 2px;
      }
      .sticky-body {
        padding:10px 12px; font-size:13px; color:#333;
        line-height:1.5; min-height:60px; outline:none;
      }
      .sticky-body:focus { background:rgba(255,253,225,0.5); }
      .sticky-arrow {
        position:absolute; bottom:-12px; left:20px;
        width:0; height:0;
        border-left:8px solid transparent; border-right:8px solid transparent;
        border-top:12px solid #F9A825;
      }

      /* 主題面板 */
      #theme-panel {
        position:fixed; top:10px; right:10px;
        background:#111; border:2px solid #FFE000;
        padding:10px 14px; z-index:9999;
        font-family:sans-serif; font-size:11px;
      }
      #theme-panel p { margin:0 0 8px; font-weight:700; font-size:10px;
        color:#FFE000; letter-spacing:1px; text-transform:uppercase; }
      #theme-panel .theme-btns { display:flex; gap:6px; }
      #theme-panel button {
        background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.2);
        cursor:pointer; font-size:11px; color:rgba(255,255,255,0.75);
        padding:5px 10px; font-family:sans-serif; transition:background 0.15s;
      }
      #theme-panel button.active { background:#FFE000; color:#111; font-weight:700; }

      /* 匯出按鈕 */
      #export-btn {
        position:fixed; bottom:80px; right:20px;
        background:#FFE000; color:#111; font-family:sans-serif;
        font-size:13px; font-weight:900; border:3px solid #111;
        padding:12px 22px; cursor:pointer; z-index:9999; letter-spacing:0.5px;
        transition:transform 0.12s;
      }
      #export-btn:hover { transform:translateY(-2px); }
      #export-badge {
        display:inline-block; background:#D63020; color:#fff;
        font-size:10px; padding:1px 6px; margin-left:6px; vertical-align:middle;
      }
      #change-indicator {
        position:fixed; bottom:60px; right:24px;
        font-family:sans-serif; font-size:11px;
        color:rgba(0,0,0,0.4); z-index:9999;
      }
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────
     注入 UI 元件
  ───────────────────────────────── */
  const bubble = document.createElement('div');
  bubble.className = 'edit-bubble';
  document.body.appendChild(bubble);

  function showBubble(el) {
    const r = el.getBoundingClientRect();
    bubble.textContent = `✏ ${fieldLabel(el)}`;
    bubble.style.left = (r.left + r.width / 2) + 'px';
    bubble.style.top  = r.top + 'px';
    bubble.classList.add('visible');
  }
  function hideBubble() { bubble.classList.remove('visible'); }

  function injectUI() {
    const badge = document.createElement('div');
    badge.id = 'edit-badge';
    badge.textContent = '✏ 編輯模式';
    document.body.appendChild(badge);

    const themePanel = document.createElement('div');
    themePanel.id = 'theme-panel';
    themePanel.innerHTML = `<p>配色主題</p><div class="theme-btns">
      ${Object.entries(THEMES).map(([k,t]) =>
        `<button data-theme-btn="${k}">${t.emoji} ${t.label}</button>`
      ).join('')}
    </div>`;
    document.body.appendChild(themePanel);
    themePanel.querySelectorAll('[data-theme-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.themeBtn);
        themePanel.querySelectorAll('[data-theme-btn]').forEach(b =>
          b.classList.toggle('active', b.dataset.themeBtn === btn.dataset.themeBtn));
      });
    });

    const indicator = document.createElement('div');
    indicator.id = 'change-indicator';
    indicator.textContent = '尚未修改';
    document.body.appendChild(indicator);

    const exportBtn = document.createElement('button');
    exportBtn.id = 'export-btn';
    exportBtn.innerHTML = '💾 匯出變更 <span id="export-badge" style="display:none">0</span>';
    exportBtn.addEventListener('click', exportChanges);
    document.body.appendChild(exportBtn);

    applyTheme('warm');
    themePanel.querySelector('[data-theme-btn="warm"]').classList.add('active');
  }

  /* ─────────────────────────────────
     主題切換
  ───────────────────────────────── */
  function applyTheme(name) {
    const theme = THEMES[name];
    if (!theme) return;
    let style = document.getElementById('editor-theme-vars');
    if (!style) { style = document.createElement('style'); style.id = 'editor-theme-vars'; document.head.appendChild(style); }
    style.textContent = `:root { ${Object.entries(theme.vars).map(([k,v]) => `${k}:${v};`).join(' ')} }`;
    activeTheme = name;
  }

  /* ─────────────────────────────────
     可編輯元素設定
  ───────────────────────────────── */
  function setupEditables() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      if (el.dataset.editorReady) return;
      el.dataset.editorReady = '1';
      el.style.position = 'relative'; // 讓 resize handle 定位正確

      // 加入寬度調整把手
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      el.appendChild(handle);
      setupResizeHandle(el, handle);

      el.addEventListener('click', e => e.stopPropagation());
      el.addEventListener('mouseenter', () => showBubble(el));
      el.addEventListener('mouseleave', hideBubble);

      el.addEventListener('click', () => {
        if (el.contentEditable === 'true') return;
        const key = makeKey(el);
        if (!changes[key]) changes[key] = { slideIdx: getSlideIdx(el), field: el.dataset.field || '', original: el.innerHTML, current: el.innerHTML };
        hideBubble();
        el.contentEditable = 'true';
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });

      el.addEventListener('blur', () => {
        if (el.contentEditable !== 'true') return;
        el.contentEditable = 'false';
        const key = makeKey(el);
        if (changes[key]) {
          changes[key].current = el.innerHTML;
          if (changes[key].current === changes[key].original) delete changes[key];
        }
        updateChangeCount();
      });

      el.addEventListener('keydown', e => {
        // 方向鍵：只移動游標，不換頁（propagation 已在 navigation.js 以 activeElement 判斷）
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
          e.stopPropagation();
        }
        // Alt+Enter → 插入 <br>
        if (e.key === 'Enter' && e.altKey) {
          e.preventDefault();
          document.execCommand('insertHTML', false, '<br>');
          return;
        }
        // Enter（無 Alt）→ 確認
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          el.blur();
        }
        // Escape → 還原
        if (e.key === 'Escape') {
          const key = makeKey(el);
          if (changes[key]) el.innerHTML = changes[key].original;
          el.contentEditable = 'false';
          updateChangeCount();
        }
      });
    });
  }

  /* ─────────────────────────────────
     寬度拖移
  ───────────────────────────────── */
  function setupResizeHandle(el, handle) {
    let startX, startWidth;

    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startWidth = el.offsetWidth;

      const onMove = mv => {
        const newWidth = Math.max(80, startWidth + (mv.clientX - startX));
        el.style.width = newWidth + 'px';
        el.style.maxWidth = 'none';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /* ─────────────────────────────────
     右鍵選單 + 備注便利貼
  ───────────────────────────────── */
  const ctxMenu = document.createElement('div');
  ctxMenu.id = 'editor-ctx-menu';
  ctxMenu.innerHTML = `
    <div class="ctx-item" id="ctx-add-note">📌 加入備注便利貼</div>
    <div class="ctx-item" id="ctx-clear-notes">🗑 清除所有備注</div>
  `;
  document.body.appendChild(ctxMenu);

  let ctxPos = { x: 0, y: 0 };

  document.addEventListener('contextmenu', e => {
    // 便利貼本身和 editor UI 不觸發
    if (e.target.closest('.sticky-note, #editor-ctx-menu, #theme-panel, #export-btn, #edit-badge')) return;
    e.preventDefault();
    ctxPos = { x: e.clientX, y: e.clientY };
    ctxMenu.style.left = e.clientX + 'px';
    ctxMenu.style.top  = e.clientY + 'px';
    ctxMenu.classList.add('visible');
  });

  document.addEventListener('click', () => ctxMenu.classList.remove('visible'));

  document.getElementById('ctx-add-note').addEventListener('click', () => {
    createNote(ctxPos.x, ctxPos.y, '');
    ctxMenu.classList.remove('visible');
  });

  document.getElementById('ctx-clear-notes').addEventListener('click', () => {
    notes.forEach(n => n.el && n.el.remove());
    notes.length = 0;
    ctxMenu.classList.remove('visible');
  });

  function createNote(x, y, text) {
    const id = ++noteIdCounter;
    const el = document.createElement('div');
    el.className = 'sticky-note';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.innerHTML = `
      <div class="sticky-header">
        <span>備注 #${id}</span>
        <button class="sticky-close" title="刪除">✕</button>
      </div>
      <div class="sticky-body" contenteditable="true" placeholder="輸入備注…">${text}</div>
      <div class="sticky-arrow"></div>
    `;
    document.body.appendChild(el);

    // 關閉按鈕
    el.querySelector('.sticky-close').addEventListener('click', e => {
      e.stopPropagation();
      el.remove();
      const idx = notes.findIndex(n => n.id === id);
      if (idx > -1) notes.splice(idx, 1);
    });

    // 便利貼內方向鍵不換頁
    el.querySelector('.sticky-body').addEventListener('keydown', e => e.stopPropagation());

    // 拖移
    makeDraggable(el, el.querySelector('.sticky-header'));

    notes.push({ id, x, y, text, el });
    return el;
  }

  function makeDraggable(el, handle) {
    let sx, sy, ox, oy;
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      sx = e.clientX; sy = e.clientY;
      ox = el.offsetLeft; oy = el.offsetTop;
      const onMove = mv => {
        el.style.left = (ox + mv.clientX - sx) + 'px';
        el.style.top  = (oy + mv.clientY - sy) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /* ─────────────────────────────────
     計數 & 匯出
  ───────────────────────────────── */
  function updateChangeCount() {
    const count = Object.keys(changes).length;
    const ind = document.getElementById('change-indicator');
    const badge = document.getElementById('export-badge');
    if (ind) ind.textContent = count === 0 ? '尚未修改' : `已修改 ${count} 處`;
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-block' : 'none'; }
  }

  function exportChanges() {
    const output = {
      exportedAt: new Date().toISOString(),
      theme: { name: activeTheme, vars: THEMES[activeTheme].vars },
      notes: notes.map(n => ({ id: n.id, x: parseFloat(n.el.style.left), y: parseFloat(n.el.style.top), text: n.el.querySelector('.sticky-body').innerHTML })),
      changes: Object.entries(changes).map(([key, d]) => ({ key, slideIdx: d.slideIdx, field: d.field, original: d.original, current: d.current }))
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'content-changes.json'; a.click();
    URL.revokeObjectURL(url);
    const btn = document.getElementById('export-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ 已匯出！';
    setTimeout(() => { btn.innerHTML = orig; updateChangeCount(); }, 2000);
  }

  /* ─────────────────────────────────
     啟動
  ───────────────────────────────── */
  function init() {
    injectStyles();
    injectUI();
    setTimeout(setupEditables, 400);
    new MutationObserver(setupEditables).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
