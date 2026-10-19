# SAAA Angoff Studio (純前端標準設定工作台)

[![100% Client-Side](https://img.shields.io/badge/Security-100%25%20Offline%20%26%20Client--Side-blue?style=for-the-badge&logo=shield)](https://github.com/SAAA-ntcu)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-emerald?style=for-the-badge&logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-sky?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![ExcelJS](https://img.shields.io/badge/ExcelJS-4.4-green?style=for-the-badge)](https://github.com/exceljs/exceljs)
[![PptxGenJS](https://img.shields.io/badge/PptxGenJS-3.12-orange?style=for-the-badge)](https://gitbrent.github.io/PptxGenJS/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> 🔒 **100% 本機離線運算 · 零個資上傳 · 隨開即用 · 專為標準設定會議（Standard Setting Meeting）打造的安戈夫法（Angoff Method）現代化純前端工作台**

本專案比照 [saaa-item-analysis](https://github.com/SAAA-ntcu/saaa-item-analysis) 與 [SAAA-Deidentification-Tool](https://github.com/SAAA-ntcu/SAAA-Deidentification-Tool) 的「SAAA 純前端哲學」，全面重構並再現 [r-angoff](https://github.com/liangchengyu-ntcu/r-angoff) 的核心業務邏輯，將原本需依賴 R 伺服器容器與 WebSocket 連線的系統，轉型為**完全由瀏覽器端自主運算之高響應、零伺服器架構**。

---

## 🌟 核心特色

1. **🔒 100% Client-Side 零伺服器隱私安全**：
   - 學生個人分數與專家審查評分**完全保留在使用者本機記憶體**，絕不上傳雲端，徹底杜絕境外資料傳輸風險，完全合規《個人資料保護法》。
2. **⚡ 60 FPS 毫秒級無延遲門檻模擬**：
   - 拖曳基礎門檻與精熟門檻滑桿時，前端即時向量化運算數萬名學生等級劃分，圓餅圖與衝擊矩陣即時流暢連動。
3. **📊 自動化出版級 16:9 簡報生成 (`.pptx`)**：
   - 使用純前端 `PptxGenJS` 原生向量化合成 16:9 簡報（封面、一致性散布圖、題目變異數雙欄表、等級比例圓餅圖與標準 5×5 矩陣）。
   - **完全擺脫外部實體 PowerPoint 模板檔案與 R `officer` 的依賴**，產出的投影片可於微軟 PowerPoint 或 Google Slides 自由二次編輯。
4. **📑 多工作表專業分析活頁簿 (`.xlsx`)**：
   - 採用 `ExcelJS` 自動產出具備凍結窗格、綠底表頭（`#C6EFCE`）、字體設定之 6 大工作表（題目統計、切截分數、變異數、門檻對照、學生分布、分析紀錄）。
5. **🧮 數值精確度與 R Base 100% 一致**：
   - 經由 Ground Truth 基準測試，平均數、樣本標準差（$N-1$）、Half-Up/Bankers 取整規則在小數點後 12 位完全相符。

---

## 📊 真實數據地面真值驗證 (Ground Truth Verification)

使用內建標準測試資料（8 位專家、13 題、30 位學生）全量比對：

| 檢驗指標 / 分析項目 | R 語言原始計算 (`r-angoff`) | 純前端 SAAA Angoff Studio | 驗證結論 |
| :--- | :---: | :---: | :---: |
| **有效專家人數 ($N$)** | **8 位** | **8 位** | **100% 一致** |
| **有效題目數量** | **13 題** | **13 題** | **100% 一致** |
| **基礎門檻 (原始平均)** | **3.5000** | **3.5000** | **100% 一致** |
| **基礎門檻 (樣本標準差)** | **0.9258** | **0.9258** | **100% 一致** |
| **精熟門檻 (原始平均)** | **8.1250** | **8.1250** | **100% 一致** |
| **精熟門檻 (樣本標準差)** | **0.8345** | **0.8345** | **100% 一致** |
| **基礎門檻 (Half-Up 決議)** | **4 題** | **4 題** | **100% 一致** |
| **精熟門檻 (Half-Up 決議)** | **8 題** | **8 題** | **100% 一致** |
| **高爭議題第 1 名** | **第 4 題 (SD = 0.53)** | **第 4 題 (SD = 0.53)** | **100% 一致** |
| **高爭議題第 2 名** | **第 9 題 (SD = 0.52)** | **第 9 題 (SD = 0.52)** | **100% 一致** |
| **高爭議題第 3 名** | **第 8 題 (SD = 0.46)** | **第 8 題 (SD = 0.46)** | **100% 一致** |
| **衝擊評估：待加強人數** | **2 人 (6.67%)** | **2 人 (6.67%)** | **100% 一致** |
| **衝擊評估：基礎人數** | **12 人 (40.00%)** | **12 人 (40.00%)** | **100% 一致** |
| **衝擊評估：精熟人數** | **16 人 (53.33%)** | **16 人 (53.33%)** | **100% 一致** |

---

## 🛠️ 快速開始 (Quick Start)

### 環境需求
- [Node.js](https://nodejs.org/) v18.0.0 以上 (建議 v20 或 v22)
- [npm](https://www.npmjs.com/) v9.0.0 以上

### 安裝與啟動
```bash
# 1. 進入專案目錄
cd saaa-angoff

# 2. 安裝依賴套件
npm install

# 3. 啟動本機開發伺服器
npm run dev

# 4. 執行地面真值回歸測試
npm test

# 5. 編譯靜態網頁生產包 (輸出至 dist/)
npm run build
```

---

## 📂 專案目錄結構

```
saaa-angoff/
├── .github/
│   └── workflows/
│       └── deploy.yml          # 🚀 自動編譯並部署至 GitHub Pages
├── public/
│   ├── sample_experts.csv      # 內建專家評分範例檔
│   └── sample_students.csv     # 內建學生分數範例檔
├── src/
│   ├── assets/
│   │   └── sampleData.js       # 離線內嵌範例字串常數 (確保 file:// 無 CORS 限制)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue   # 頂部導覽列 (標誌、5大功能分頁膠囊)
│   │   │   ├── MetricCard.vue  # 統計數值摘要卡片
│   │   │   └── StatusBlock.vue # 資料品質檢核狀態卡
│   │   └── tabs/
│   │       ├── DataTab.vue       # 1. 資料匯入、缺答政策、題數滑桿與即時預覽
│   │       ├── ExpertsTab.vue    # 2. 專家一致性散布圖 (Chart 1/2)、切截矩陣
│   │       ├── ItemsTab.vue      # 3. 高爭議題長條圖 (Top 15)、題目統計表
│   │       ├── SimulationTab.vue # 4. 門檻微調雙滑桿、等級比例圓餅圖、衝擊矩陣
│   │       └── ReportsTab.vue    # 5. Excel/HTML/PPTX 匯出與 16:9 簡報逐頁預覽
│   ├── core/
│   │   ├── constants.js          # SAAA 等級標籤、配色與候選欄名
│   │   ├── math.js               # SAAAMath 高精度 BigInt 與樣本標準差
│   │   ├── validation.js         # 矩陣遮罩檢查、缺答規則與範圍防呆
│   │   ├── analysis.js           # Angoff 核心統計引擎 (無介面依賴)
│   │   ├── simulation.js         # 學生分數等級劃分與衝擊引擎
│   │   ├── pptxGenerator.js      # PptxGenJS 16:9 出版級簡報生成器
│   │   ├── excelGenerator.js     # ExcelJS 帶格式多工作表生成器
│   │   └── htmlReportGenerator.js# 獨立離線 HTML 報告生成器
│   ├── App.vue                   # 應用程式根元件與響應式資料流
│   ├── main.js                   # Vite 進入點
│   └── style.css                 # Tailwind CSS 與自訂評量樣式
├── test/
│   └── ground_truth.test.js      # 自動化 Ground Truth 驗證測試
├── index.html                    # HTML 入口
├── vite.config.js                # Vite 建置配置 (相對路徑 base: './')
├── tailwind.config.js            # Tailwind 主題擴充配置
└── package.json
```

---

## 📑 輸入資料格式規格

### 1. 專家評分資料 (`.csv`, `.xlsx`, `.xls`)
- **必要欄位**：`成員代碼`（文字型專家識別碼，如 `A01`、`A02`）。
- **題目欄位**：以 `題號` 開頭的題目評分欄（例如 `題號1`, `題號2` ...）。
- **評分值域**：每題僅允許填寫整數 `1`、`2`、`3`。
  - `1`：**待加強**
  - `2`：**基礎**
  - `3`：**精熟**
- **缺答處理政策**：
  - `阻止分析`：發現任何空白或 `BLANK` 時中止運算並指出行列位置。
  - `排除缺值`：計算該題各項指標時排除空白評分。

### 2. 學生分數資料 (`.csv`, `.xlsx`, `.xls`)
- **選填**（不匯入學生分數時，專家一致性與題目分析仍可完整運作）。
- 需在介面選定一欄為學生總分（系統自動偵測 `SUM(答對題數)`、`得分`、`分數`、`score` 等欄位）。
- 分數範圍需介於 0 至分析題數之間。

---

## 📜 授權協議 (License)

本專案基於 [MIT License](LICENSE) 條款開源發布。  
版權所有 © 2026 **國立臺中教育大學 測驗統計與適性學習研究中心 (NTCU IER)**。
