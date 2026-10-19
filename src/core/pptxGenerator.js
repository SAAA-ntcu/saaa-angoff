import pptxgen from 'pptxgenjs';
import { buildConsistencyChartOption, buildPieChartOption, renderChartToBase64 } from './chartRenderer.js';

export async function generatePptxReport({
  fieldName = '自然',
  roundCn = '一',
  analysis,
  studentResult = null,
  chart1Base64 = null,
  chart2Base64 = null,
  pieChartBase64 = null
}) {
  const pres = new pptxgen();
  // Standard Modern Widescreen 16:9 (13.333 x 7.5 inches) matching PowerPoint standard
  pres.defineLayout({ name: 'WIDE_16x9', width: 13.333, height: 7.5 });
  pres.layout = 'WIDE_16x9';
  pres.author = 'SAAA Angoff Studio';
  pres.title = `${fieldName}領域 標準設定會議 第${roundCn}輪分析報告`;

  const fontFam = 'Microsoft JhengHei';
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  const legacy = analysis.legacyThresholds;
  const baseAvg = legacy.基礎;
  const baseSd = legacy.基礎標準差;
  const mastAvg = legacy.精熟;
  const mastSd = legacy.精熟標準差;

  // Auto-generate fresh charts if not provided
  let c1 = chart1Base64;
  let c2 = chart2Base64;
  let pie = pieChartBase64;

  if (typeof document !== 'undefined') {
    const expertScores1 = analysis.expertStats ? analysis.expertStats.map(e => e.基礎切截分數) : [];
    const expertScores2 = analysis.expertStats ? analysis.expertStats.map(e => e.精熟切截分數) : [];
    if (!c1 && expertScores1.length > 0) {
      c1 = renderChartToBase64(buildConsistencyChartOption('基礎', expertScores1, baseAvg, baseSd));
    }
    if (!c2 && expertScores2.length > 0) {
      c2 = renderChartToBase64(buildConsistencyChartOption('精熟', expertScores2, mastAvg, mastSd));
    }
    if (!pie && studentResult) {
      pie = renderChartToBase64(buildPieChartOption(studentResult.summary), 1000, 1000);
    }
  }

  // ==========================================
  // Slide 1: 封面
  // ==========================================
  const slide1 = pres.addSlide();
  slide1.addText(
    [
      { text: `${fieldName}領域\n`, options: { fontSize: 44, bold: true, color: '1B365D' } },
      { text: '標準設定會議', options: { fontSize: 44, bold: true, color: '1B365D' } }
    ],
    { x: 1.5, y: 1.4, w: 10.33, h: 2.2, align: 'center', fontFace: fontFam }
  );

  slide1.addText(
    [
      { text: `第${roundCn}輪專家評分結果分析報告\n\n`, options: { fontSize: 24, bold: true, color: '595959' } },
      { text: `會議日期：${dateStr}`, options: { fontSize: 14, color: '7F7F7F' } }
    ],
    { x: 1.5, y: 4.2, w: 10.33, h: 2.0, align: 'center', fontFace: fontFam }
  );

  // ==========================================
  // Slide 2: 基礎等級門檻分析 (Cut Score)
  // ==========================================
  const slide2 = pres.addSlide();
  slide2.addText('基礎等級門檻分析 (Cut Score)', {
    x: 1.0, y: 0.4, w: 11.33, h: 0.6,
    fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

  if (c1) {
    slide2.addImage({
      data: c1,
      x: 1.2, y: 1.15, w: 10.93, h: 4.55
    });
  }

  slide2.addText(
    [
      { text: '基礎等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 13.5, color: '000000' } },
      { text: `• 基礎 - 1個標準差 (寬鬆門檻)：${baseAvg - baseSd} 題\n`, options: { fontSize: 12.5, color: '333333' } },
      { text: `• 基礎等級 (平均門檻值)：${baseAvg} 題\n`, options: { fontSize: 12.5, bold: true, color: '385723' } },
      { text: `• 基礎 + 1個標準差 (嚴格門檻)：${baseAvg + baseSd} 題`, options: { fontSize: 12.5, color: '333333' } }
    ],
    { x: 1.2, y: 5.85, w: 10.93, h: 1.35, fontFace: fontFam }
  );

  // ==========================================
  // Slide 3: 精熟等級門檻分析 (Cut Score)
  // ==========================================
  const slide3 = pres.addSlide();
  slide3.addText('精熟等級門檻分析 (Cut Score)', {
    x: 1.0, y: 0.4, w: 11.33, h: 0.6,
    fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

  if (c2) {
    slide3.addImage({
      data: c2,
      x: 1.2, y: 1.15, w: 10.93, h: 4.55
    });
  }

  slide3.addText(
    [
      { text: '精熟等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 13.5, color: '000000' } },
      { text: `• 精熟 - 1個標準差 (寬鬆門檻)：${mastAvg - mastSd} 題\n`, options: { fontSize: 12.5, color: '333333' } },
      { text: `• 精熟等級 (平均門檻值)：${mastAvg} 題\n`, options: { fontSize: 12.5, bold: true, color: '385723' } },
      { text: `• 精熟 + 1個標準差 (嚴格門檻)：${mastAvg + mastSd} 題`, options: { fontSize: 12.5, color: '333333' } }
    ],
    { x: 1.2, y: 5.85, w: 10.93, h: 1.35, fontFace: fontFam }
  );

  // ==========================================
  // Slide 4 ~ N: 題目變異數排序表
  // ==========================================
  const varSheet = analysis.varianceSheet;
  // If total items <= 16, put on 1 slide.
  // If total items > 16, comfortably paginate with max 10 items per column (max 20 items per slide).
  // For 35 items: Slide 1 has 18 items (9 left, 9 right), Slide 2 has 17 items (9 left, 8 right).
  // Total 10 rows per column (1 header + 9 items) = 3.8 inches tall.
  // Leaves 2.5 inches of margin at bottom, 100% immune to cut-off.
  const itemsPerSlide = varSheet.length <= 16 ? varSheet.length : 20;
  const numSlides = Math.ceil(varSheet.length / itemsPerSlide) || 1;

  for (let sIdx = 0; sIdx < numSlides; sIdx++) {
    const slide = pres.addSlide();
    const startIdx = sIdx * itemsPerSlide;
    const endIdx = Math.min((sIdx + 1) * itemsPerSlide, varSheet.length);
    const subItems = varSheet.slice(startIdx, endIdx);
    const splitPoint = Math.ceil(subItems.length / 2);

    const leftItems = subItems.slice(0, splitPoint);
    const rightItems = subItems.slice(splitPoint);

    const slideTitle = numSlides > 1 
      ? `題目變異數排序表 (${sIdx + 1}/${numSlides})` 
      : '題目變異數排序表';

    slide.addText(slideTitle, {
      x: 1.0, y: 0.4, w: 11.33, h: 0.5,
      fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
    });

    const buildTableRows = (items) => {
      const rows = [
        [
          { text: '題號', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } },
          { text: '變異數', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } },
          { text: 'A', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } },
          { text: 'B', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } },
          { text: 'C', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } }
        ]
      ];
      items.forEach((item, rIdx) => {
        const bg = rIdx % 2 === 1 ? 'E6E6E6' : 'FFFFFF';
        rows.push([
          { text: String(item.題號), options: { align: 'center', fill: { color: bg } } },
          { text: String(item.標準差), options: { align: 'center', fill: { color: bg } } },
          { text: String(item.A), options: { align: 'center', fill: { color: bg } } },
          { text: String(item.B), options: { align: 'center', fill: { color: bg } } },
          { text: String(item.C), options: { align: 'center', fill: { color: bg } } }
        ]);
      });
      return rows;
    };

    const colWidths = [1.0, 1.3, 1.0, 1.0, 1.1]; // total = 5.4 in
    const tableOptions = {
      y: 1.15,
      w: 5.4,
      colW: colWidths,
      fontSize: 12,
      fontFace: fontFam,
      margin: [2.5, 3, 2.5, 3],
      border: { type: 'solid', pt: 0.5, color: '000000' }
    };

    if (leftItems.length > 0) {
      slide.addTable(buildTableRows(leftItems), {
        ...tableOptions,
        x: 1.0
      });
    }

    if (rightItems.length > 0) {
      slide.addTable(buildTableRows(rightItems), {
        ...tableOptions,
        x: 6.9
      });
    }
  }

  // ==========================================
  // Slide N+1: 學生分布頁 (若有學生資料)
  // ==========================================
  if (studentResult) {
    const slideStu = pres.addSlide();
    slideStu.addText('學生等級比例分布', {
      x: 1.0, y: 0.4, w: 11.33, h: 0.6,
      fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
    });

    if (pie) {
      slideStu.addImage({
        data: pie,
        x: 0.8, y: 1.2, w: 5.8, h: 5.6
      });
    }

    const basicThreshold = Number(studentResult.thresholds.基礎);
    const masteryThreshold = Number(studentResult.thresholds.精熟);
    const nItems = analysis.nItems;

    // Threshold indicator badges
    slideStu.addShape(pres.ShapeType.rect, {
      x: 7.0, y: 1.3, w: 2.6, h: 0.65,
      fill: { color: 'F59E0B' },
      line: { color: 'D97706', width: 1 }
    });
    slideStu.addText(`基礎門檻：${basicThreshold} 題`, {
      x: 7.0, y: 1.3, w: 2.6, h: 0.65,
      fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', fontFace: fontFam
    });

    slideStu.addShape(pres.ShapeType.rect, {
      x: 10.0, y: 1.3, w: 2.6, h: 0.65,
      fill: { color: '64748B' },
      line: { color: '475569', width: 1 }
    });
    slideStu.addText(`精熟門檻：${masteryThreshold} 題`, {
      x: 10.0, y: 1.3, w: 2.6, h: 0.65,
      fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', fontFace: fontFam
    });

    // Formatted Table
    const summary = studentResult.summary;
    const needsRow = summary.find(s => s.等級 === '待加強') || { 人數: 0, 百分比: 0 };
    const basicRow = summary.find(s => s.等級 === '基礎') || { 人數: 0, 百分比: 0 };
    const mastRow = summary.find(s => s.等級 === '精熟') || { 人數: 0, 百分比: 0 };
    const totalCount = studentResult.totalValid;

    const stuRows = [
      [
        { text: '最低能力', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } },
        { text: '答對題數', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } },
        { text: '全體', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'center' } },
        { text: '人數', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'right' } },
        { text: '百分比', options: { bold: true, fill: { color: 'C6EFCE' }, align: 'right' } }
      ],
      [
        { text: '', options: { align: 'center' } },
        { text: `0 - ${Math.max(0, basicThreshold - 1)}`, options: { align: 'center', bold: true } },
        { text: '待加強', options: { align: 'center' } },
        { text: needsRow.人數.toLocaleString(), options: { align: 'right' } },
        { text: `${Math.round(needsRow.百分比 * 100)}%`, options: { align: 'right' } }
      ],
      [
        { text: '基礎', options: { align: 'center', bold: true, color: 'B45309' } },
        { text: `${basicThreshold} - ${Math.max(basicThreshold, masteryThreshold - 1)}`, options: { align: 'center', bold: true } },
        { text: '基礎', options: { align: 'center' } },
        { text: basicRow.人數.toLocaleString(), options: { align: 'right' } },
        { text: `${Math.round(basicRow.百分比 * 100)}%`, options: { align: 'right' } }
      ],
      [
        { text: '精熟', options: { align: 'center', bold: true, color: '334155' } },
        { text: `${masteryThreshold} - ${nItems}`, options: { align: 'center', bold: true } },
        { text: '精熟', options: { align: 'center' } },
        { text: mastRow.人數.toLocaleString(), options: { align: 'right' } },
        { text: `${Math.round(mastRow.百分比 * 100)}%`, options: { align: 'right' } }
      ],
      [
        { text: '合計', options: { colspan: 3, bold: true, align: 'center', fill: { color: 'F1F5F9' } } },
        { text: totalCount.toLocaleString(), options: { bold: true, align: 'right', fill: { color: 'F1F5F9' } } },
        { text: '100%', options: { bold: true, align: 'right', fill: { color: 'F1F5F9' } } }
      ]
    ];

    slideStu.addTable(stuRows, {
      x: 7.0, y: 2.3, w: 5.6,
      colW: [1.1, 1.4, 1.1, 1.0, 1.0],
      fontSize: 12,
      fontFace: fontFam,
      margin: [3, 4, 3, 4],
      border: { type: 'solid', pt: 0.5, color: '000000' }
    });
  }

  return pres;
}
