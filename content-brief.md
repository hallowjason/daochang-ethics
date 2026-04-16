# 道場倫理與行政倫理 — Content Brief

## 核心訊息
道場的品質由每一個人共同決定——從「尊前提後」的倫理觀，到「健康雙向溝通」的行政觀，修道人的底層心態決定了這個道場的樣子。

## 聽眾與情境
- **聽眾**：道場研習班學員（修道人、幹部、後學）
- **情境**：研習班現場投影 + GitHub Pages 公開網址（供其他人參考）
- **痛點**：人事關係不清、不知如何與上方溝通、把「尊敬」理解為服從
- **期待感受**：聽完後有清晰的倫理框架，且感到溫暖被接納，而非被說教

## 素材庫

### 金句 / 關鍵詞
- 「修道傳統化，辦道社會化，道場管理化」（活佛師尊慈諭）
- 「道不是行與能，而在低心下氣」（老祖師慈諭）
- 「初念淺，轉念深」
- 「有德無道則天人路迷，有道無德則師徒絕路」
- 「後學，是一種心態」
- 「什麼樣的道場，由我們來決定」

### 引用經文
- 師尊慈訓：壇辦職責非輕，承上啟下導後行（完整原文見 slides_outline.md）
- 陳老樞紐妙極大帝：不燒香如何表示誠心，欲要成佛勤禮拜

### 互動遊戲（共 3 個）
1. **①「初念 vs. 轉念」情境換位**（第一章末）——左右分組，情境引導
2. **②「文字雲共創」**（第二章末）——手機掃 QR 輸入，文字雲即時顯示於投影片
3. **③「尋找前賢」賓果遊戲**（第三章末）——九宮格直接顯示在投影片

### 特殊設計需求
- **前賢列表頁**：12 條前賢定義，卡片逐一堆疊動畫（書桌凌亂旋轉堆積效果）
- **互動②文字雲**：需 Firebase Realtime DB + QR Code，結果即時顯示在簡報頁
- **互動⑥給道場的一封信**（第六章末）：牛皮紙卡片 UI，Firebase 獨立分支，QR Code
- **雙語等重**：每頁中文一行 + 英文同字號次行（英文 Terracotta 色）

---

## 視覺規格卡（Claude Design × JF 金萱）

```
背景系統（交替章節感）
  淺色頁：Parchment #f5f4ed（內文、說明、對比頁）
  深色頁：Near Black #141413（封面、章節封面、金句頁）

色彩角色
  主要文字：#141413（淺色頁）/ Ivory #faf9f5（深色頁）
  次要文字：Olive Gray #5e5d59
  強調 / 英文行：Terracotta #c96442
  邊框淺色：Border Cream #f0eee6
  邊框深色：Dark Surface #30302e

字體系統
  中文大標 → jf-jinxuan-bold（封面、章節標題、金句）
  中文副標 → jf-jinxuan-medium（說明標、欄位標題）
  中文內文 → jf-jinxuan-book（長段引文、說明段落）
  英文全部 → Cormorant Garamond（Google Fonts）

雙語等重排法
  中文一行（jf-jinxuan，白或深色）
  英文同字號次行（Cormorant Garamond，Terracotta #c96442）

字型資產
  本機路徑：~/Library/Fonts/jf-jinxuan-3.1-bold.otf
             ~/Library/Fonts/jf-jinxuan-3.1-medium.otf
             ~/Library/Fonts/jf-jinxuan-3.1-book.otf
  部署方式：複製至 assets/fonts/，@font-face 引用
  英文：Google Fonts CDN（Cormorant Garamond 400/600/700）

陰影系統
  互動元素：ring shadow 0px 0px 0px 1px
  卡片浮起：rgba(0,0,0,0.05) 0px 4px 24px
  無大面積投影陰影

圓角系統
  卡片 8px / 主按鈕 12px / Hero容器 32px

動畫
  頁面切換：fade + slide-up 0.6s ease
  卡片堆疊：前賢列表頁（逐卡淡入 + 隨機旋轉堆積）
  金句頁：Terracotta 呼吸光暈
  互動頁：文字雲 / 牛皮紙卡入場動效

氣氛詞：厚、暖、文人氣、有人情味
```

---

## 技術需求

- **響應式三層**：Desktop canvas / Tablet JS scale / Mobile scroll
- **部署**：GitHub Pages 靜態站（assets 含字型檔）
- **互動功能**：Firebase Realtime DB（文字雲 + 給道場的信）
- **QR Code**：使用 qrcode.js 動態生成，不依賴外部 API

---

## 頁面結構（38 頁）

| # | 頁面標題 | 類型 | 深/淺底 |
|---|---------|------|---------|
| 1 | 封面：道場倫理與行政倫理 | cover | 深 |
| 2 | 目錄（六章） | toc | 深 |
| 3 | 章節封面 1/6：道場與企業的人才有何不同？ | chapter | 深 |
| 4 | 初念 vs 轉念（左右對比） | compare | 淺 |
| 5 | 企業人才的對照 | content | 淺 |
| 6 | 終極目標（大字金句） | quote | 深 |
| 7 | 互動① 初念 vs 轉念情境換位 | interactive | 淺 |
| 8 | 章節封面 2/6：道要拓展出去的基本單位 | chapter | 深 |
| 9 | 人才三大特質（三欄卡片） | cards | 淺 |
| 10 | 師尊慈訓（書法引言卡） | scripture | 深 |
| 11 | 老祖師慈諭（過渡橋梁大字） | quote | 深 |
| 12 | 互動② 文字雲共創（Firebase + QR） | interactive | 深 |
| 13 | 章節封面 3/6：低心下氣，道場能「和」 | chapter | 深 |
| 14 | 誰是前賢？（卡片堆疊動畫，12條） | stack | 淺 |
| 15 | 前賢的意義 | content | 淺 |
| 16 | 尊前有道，提後有德（雙欄對比） | compare | 淺 |
| 17 | 有德無道 / 有道無德（警示對比） | compare | 深 |
| 18 | 有前無後 / 有後無前（情境雙欄） | compare | 淺 |
| 19 | 尊前提後觀念總結（六行對照表） | table | 淺 |
| 20 | 禮拜的意義 | content | 淺 |
| 21 | 後學就是一種心態（大字金句） | quote | 深 |
| 22 | 互動③ 尋找前賢賓果（九宮格） | interactive | 淺 |
| 23 | 章節封面 4/6：你的上方是誰？ | chapter | 深 |
| 24 | 情境一：在自己的區域 | content | 淺 |
| 25 | 情境二：短期開荒 | content | 淺 |
| 26 | 前提：報備制度 | content | 淺 |
| 27 | 本章核心（大字金句） | quote | 深 |
| 28 | 章節封面 5/6：健康雙向的交流環境 | chapter | 深 |
| 29 | 不是一言堂 | content | 淺 |
| 30 | 底層心態 | quote | 深 |
| 31 | 權責判斷與溝通方式（分支流程圖） | flow | 淺 |
| 32 | 章節封面 6/6：什麼樣的道場由我們決定 | chapter | 深 |
| 33 | 有廟就有和尚 | content | 淺 |
| 34 | 幹部的力量 | content | 淺 |
| 35 | 活佛師尊慈諭：三化（大字） | quote | 深 |
| 36 | 道場管理兩大工程（雙圓環圖） | diagram | 淺 |
| 37 | 互動⑥ 給道場的一封信（Firebase + QR） | interactive | 深 |
| 38 | 結尾：什麼樣的道場，由我們來決定 | closing | 深 |
