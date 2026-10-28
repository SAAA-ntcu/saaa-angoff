import pptxgen from 'pptxgenjs';
import { buildConsistencyChartOption, buildPieChartOption, renderChartToBase64 } from './chartRenderer.js';
import { SAAAMath } from './math.js';
import { VARIANCE_ITEMS_PER_SLIDE } from './constants.js';

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
      { text: `${fieldName}領域\n`, options: { fontSize: 60, bold: true, color: '1B365D' } },
      { text: '標準設定會議', options: { fontSize: 60, bold: true, color: '1B365D' } }
    ],
    { x: 2.667, y: 1.4, w: 8, h: 1.8, align: 'center', fontFace: fontFam }
  );

  slide1.addText(
    [
      { text: `第${roundCn}輪專家評分結果分析報告\n\n`, options: { fontSize: 32, bold: true, color: '595959' } },
      { text: `會議日期：${dateStr}`, options: { fontSize: 14, color: '7F7F7F' } }
    ],
    { x: 2.667, y: 4.14, w: 8, h: 2.5, align: 'center', fontFace: fontFam }
  );

  // ==========================================
  // Slide 2: 基礎等級門檻分析 (Cut Score)
  // ==========================================
  const slide2 = pres.addSlide();
  slide2.addText('基礎等級門檻分析 (Cut Score)', {
    x: 2.167, y: 0.4, w: 9, h: 0.6,
    fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

  if (c1) {
    slide2.addImage({
      data: c1,
      x: 2.167, y: 1.3, w: 9, h: 4.5
    });
  }

  slide2.addText(
    [
      { text: '基礎等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 14, color: '000000' } },
      { text: `• 基礎 - 1個標準差 (寬鬆門檻)：${baseAvg - baseSd} 題\n`, options: { fontSize: 14, color: '333333' } },
      { text: `• 基礎等級 (平均門檻值)：${baseAvg} 題\n`, options: { fontSize: 14, bold: true, color: '385723' } },
      { text: `• 基礎 + 1個標準差 (嚴格門檻)：${baseAvg + baseSd} 題`, options: { fontSize: 14, color: '333333' } }
    ],
    { x: 2.167, y: 5.9, w: 9, h: 1.2, fontFace: fontFam }
  );

  // ==========================================
  // Slide 3: 精熟等級門檻分析 (Cut Score)
  // ==========================================
  const slide3 = pres.addSlide();
  slide3.addText('精熟等級門檻分析 (Cut Score)', {
    x: 2.167, y: 0.4, w: 9, h: 0.6,
    fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

  if (c2) {
    slide3.addImage({
      data: c2,
      x: 2.167, y: 1.3, w: 9, h: 4.5
    });
  }

  slide3.addText(
    [
      { text: '精熟等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 14, color: '000000' } },
      { text: `• 精熟 - 1個標準差 (寬鬆門檻)：${mastAvg - mastSd} 題\n`, options: { fontSize: 14, color: '333333' } },
      { text: `• 精熟等級 (平均門檻值)：${mastAvg} 題\n`, options: { fontSize: 14, bold: true, color: '385723' } },
      { text: `• 精熟 + 1個標準差 (嚴格門檻)：${mastAvg + mastSd} 題`, options: { fontSize: 14, color: '333333' } }
    ],
    { x: 2.167, y: 5.9, w: 9, h: 1.2, fontFace: fontFam }
  );

  // ==========================================
  // Slide 4 ~ N: 題目標準差排序表
  // ==========================================
  const varSheet = analysis.varianceSheet;
  // Match r-angoff: 19 item rows per column, 38 rows per slide.
  const itemsPerSlide = VARIANCE_ITEMS_PER_SLIDE;
  const numSlides = Math.ceil(varSheet.length / itemsPerSlide);

  for (let sIdx = 0; sIdx < numSlides; sIdx++) {
    const slide = pres.addSlide();
    const startIdx = sIdx * itemsPerSlide;
    const endIdx = Math.min((sIdx + 1) * itemsPerSlide, varSheet.length);
    const subItems = varSheet.slice(startIdx, endIdx);
    const splitPoint = Math.ceil(subItems.length / 2);

    const leftItems = subItems.slice(0, splitPoint);
    const rightItems = subItems.slice(splitPoint);

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
        const bg = rIdx % 2 === 0 ? 'E6E6E6' : 'FFFFFF';
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

    const varianceRowHeight = 0.385;
    const tableOptions = {
      y: 0.18,
      w: 4.8,
      rowH: varianceRowHeight,
      fontSize: 15,
      fontFace: fontFam,
      margin: [2, 2, 2, 2],
      // PptxGenJS emits a valid OOXML `anchor="ctr"` for "middle"; "mid"
      // is serialized literally and causes PowerPoint to reject the deck.
      valign: 'middle',
      border: { type: 'solid', pt: 0.5, color: '000000' }
    };

    if (leftItems.length > 0) {
      slide.addTable(buildTableRows(leftItems), {
        ...tableOptions,
        x: 1.867,
        h: (leftItems.length + 1) * varianceRowHeight,
        colW: [0.96, 1.05, 0.87, 0.96, 0.96]
      });
    }

    if (rightItems.length > 0) {
      slide.addTable(buildTableRows(rightItems), {
        ...tableOptions,
        x: 6.667,
        h: (rightItems.length + 1) * varianceRowHeight,
        colW: [0.89, 1.03, 0.96, 0.96, 0.96]
      });
    }
  }

  // ==========================================
  // Slide N+1: 學生分布頁 (若有學生資料)
  // ==========================================
  if (studentResult) {
    const slideStu = pres.addSlide();
    slideStu.addText('學生等級比例分布', {
      x: 1.667, y: 0.4, w: 4.5, h: 0.6,
      fontSize: 24, color: '000000', align: 'left', fontFace: fontFam
    });

    if (pie) {
      slideStu.addImage({
        data: pie,
        x: 0.25, y: 1.15, w: 4.75, h: 4.75
      });
    }

    const basicThreshold = Number(studentResult.thresholds.基礎);
    const masteryThreshold = Number(studentResult.thresholds.精熟);
    const nItems = analysis.nItems;

    // Keep the original five-column table, orange header and plain white body.
    const summary = studentResult.summary;
    const needsRow = summary.find(s => s.等級 === '待加強') || { 人數: 0, 百分比: 0 };
    const basicRow = summary.find(s => s.等級 === '基礎') || { 人數: 0, 百分比: 0 };
    const mastRow = summary.find(s => s.等級 === '精熟') || { 人數: 0, 百分比: 0 };
    const totalCount = studentResult.totalValid;

    const stuRows = [
      [
        { text: '最低能力', options: { bold: true, color: 'FFFFFF', fill: { color: 'ED7D31' }, align: 'center', border: { type: 'solid', pt: 0.5, color: 'FFFFFF' } } },
        { text: '答對題數', options: { bold: true, color: 'FFFFFF', fill: { color: 'ED7D31' }, align: 'center', border: { type: 'solid', pt: 0.5, color: 'FFFFFF' } } },
        { text: '全體', options: { bold: true, color: 'FFFFFF', fill: { color: 'ED7D31' }, align: 'center', border: { type: 'solid', pt: 0.5, color: 'FFFFFF' } } },
        { text: '人數', options: { bold: true, color: 'FFFFFF', fill: { color: 'ED7D31' }, align: 'center', border: { type: 'solid', pt: 0.5, color: 'FFFFFF' } } },
        { text: '百分比', options: { bold: true, color: 'FFFFFF', fill: { color: 'ED7D31' }, align: 'center', border: { type: 'solid', pt: 0.5, color: 'FFFFFF' } } }
      ],
      [
        { text: '', options: { align: 'center' } },
        { text: `0-${Math.max(0, basicThreshold - 1)}`, options: { align: 'center' } },
        { text: '待加強', options: { align: 'center' } },
        { text: String(needsRow.人數), options: { align: 'center' } },
        { text: SAAAMath.formatPercent(needsRow.百分比, 0), options: { align: 'center' } }
      ],
      [
        { text: '基礎', options: { align: 'center', color: '7030A0' } },
        { text: `${basicThreshold}-${Math.max(basicThreshold, masteryThreshold - 1)}`, options: { align: 'center' } },
        { text: '基礎', options: { align: 'center' } },
        { text: String(basicRow.人數), options: { align: 'center' } },
        { text: SAAAMath.formatPercent(basicRow.百分比, 0), options: { align: 'center' } }
      ],
      [
        { text: '精熟', options: { align: 'center', color: '7030A0' } },
        { text: `${masteryThreshold}-${nItems}`, options: { align: 'center' } },
        { text: '精熟', options: { align: 'center' } },
        { text: String(mastRow.人數), options: { align: 'center' } },
        { text: SAAAMath.formatPercent(mastRow.百分比, 0), options: { align: 'center' } }
      ],
      [
        { text: '', options: { align: 'center' } },
        { text: '', options: { align: 'center' } },
        { text: '合計', options: { align: 'center', bold: true } },
        { text: String(totalCount), options: { align: 'center', bold: true } },
        { text: '100%', options: { align: 'center', bold: true } }
      ]
    ];

    const studentRowHeights = [0.622, 0.766, 0.722, 0.722, 0.722];
    slideStu.addTable(stuRows, {
      x: 5.217, y: 1.644, w: 7.437,
      h: studentRowHeights.reduce((total, rowHeight) => total + rowHeight, 0),
      colW: [1.4874, 1.4874, 1.4874, 1.4874, 1.4874],
      rowH: studentRowHeights,
      fontSize: 18,
      fontFace: fontFam,
      margin: [2, 3, 2, 3],
      valign: 'middle',
      border: { type: 'solid', pt: 0.5, color: 'ED7D31' }
    });
    slideStu.addShape(pres.ShapeType.rect, {
      x: 5.217, y: 1.644, w: 7.437,
      h: studentRowHeights.reduce((total, rowHeight) => total + rowHeight, 0),
      fill: { color: 'FFFFFF', transparency: 100 },
      line: { color: 'C65911', width: 1 }
    });

    // The original deck marks both cut scores with outlined number boxes in
    // the first column, aligned beside the two threshold categories.
    const addThresholdMarker = (value, y) => {
      slideStu.addShape(pres.ShapeType.rect, {
        x: 6.296, y, w: 0.634, h: 0.505,
        fill: { color: 'FFFFFF' },
        line: { color: '000000', width: 1 }
      });
      slideStu.addText(String(value), {
        x: 6.296, y, w: 0.634, h: 0.505,
        margin: 0, fontSize: 24, bold: true, color: '000000',
        align: 'center', valign: 'mid', fontFace: fontFam
      });
    };
    addThresholdMarker(basicThreshold, 2.817);
    addThresholdMarker(masteryThreshold, 3.522);

    slideStu.addText(String(4 + numSlides), {
      x: 9.417, y: 6.95, w: 3, h: 0.4,
      fontSize: 14, color: 'A6A6A6', align: 'right', fontFace: fontFam
    });
  }

  return pres;
}
