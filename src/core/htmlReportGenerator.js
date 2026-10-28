import { SAAAMath } from './math.js';

export function generateHtmlReport({ analysis, studentResult = null }) {
  const now = new Date();
  const dateStr = now.toLocaleString('zh-TW');

  const escape = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const thresholdRows = ['基礎', '精熟'].map(lvl => `
    <tr>
      <td>${escape(lvl)}</td>
      <td>${SAAAMath.formatFixed(analysis.thresholds.raw[lvl], 2)}</td>
      <td><strong>${analysis.thresholds.current[lvl]}</strong></td>
      <td>${SAAAMath.formatFixed(analysis.thresholds.standardDeviation[lvl], 2)}</td>
    </tr>
  `).join('');

  let studentSection = '';
  if (studentResult) {
    const stuRows = studentResult.summary.map(s => `
      <tr>
        <td>${escape(s.等級)}</td>
        <td>${s.人數.toLocaleString()}</td>
        <td>${SAAAMath.formatPercent(s.百分比, 1)}</td>
      </tr>
    `).join('');

    studentSection = `
      <h2>學生分布</h2>
      <table>
        <thead>
          <tr>
            <th>等級</th>
            <th>人數</th>
            <th>百分比</th>
          </tr>
        </thead>
        <tbody>
          ${stuRows}
        </tbody>
      </table>
    `;
  }

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Angoff Studio 分析報告</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft JhengHei", "PingFang TC", sans-serif;
      max-width: 960px;
      margin: 40px auto;
      padding: 0 20px;
      color: #172033;
      line-height: 1.6;
    }
    h1, h2 { color: #173B66; }
    h1 { border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0 32px;
    }
    th, td {
      border: 1px solid #CBD5E1;
      padding: 10px;
      text-align: center;
    }
    th { background: #EAF2FA; font-weight: 600; }
    .meta { color: #64748B; font-size: 0.95rem; }
    .metric-grid {
      display: flex;
      gap: 16px;
      margin: 20px 0;
    }
    .metric {
      flex: 1;
      padding: 16px 20px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      text-align: center;
    }
    .metric strong {
      display: block;
      font-size: 1.8rem;
      color: #1D4E89;
      margin-top: 4px;
    }
    @media print {
      body { margin: 20px; }
    }
  </style>
</head>
<body>
  <h1>Angoff Studio 分析報告</h1>
  <p class="meta">產生時間：${escape(dateStr)}</p>

  <div class="metric-grid">
    <div class="metric">專家數<strong>${analysis.nExperts}</strong></div>
    <div class="metric">題目數<strong>${analysis.nItems}</strong></div>
    <div class="metric">基礎門檻<strong>${analysis.thresholds.current.基礎}</strong></div>
    <div class="metric">精熟門檻<strong>${analysis.thresholds.current.精熟}</strong></div>
  </div>

  <h2>切截門檻</h2>
  <table>
    <thead>
      <tr>
        <th>等級</th>
        <th>原始平均</th>
        <th>當前門檻</th>
        <th>標準差</th>
      </tr>
    </thead>
    <tbody>
      ${thresholdRows}
    </tbody>
  </table>

  ${studentSection}

  <h2>方法設定</h2>
  <p>缺答政策：${escape(analysis.missingPolicy === 'error' ? '阻止分析' : '排除缺值')}；取整規則：${escape(analysis.roundingMethod)}。</p>
</body>
</html>`;
}
