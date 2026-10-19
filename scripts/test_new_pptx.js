import fs from 'fs';
import path from 'path';
import pptxgen from 'pptxgenjs';
import Papa from 'papaparse';
import { calculateAngoff } from '../src/core/analysis.js';
import { classifyStudents } from '../src/core/simulation.js';
import { PRESET_DATASETS } from '../src/assets/sampleData.js';

const data = PRESET_DATASETS['set_35'];
const exp = Papa.parse(data.expertCsv, { header: true, skipEmptyLines: true });
const stu = Papa.parse(data.studentCsv, { header: true, skipEmptyLines: true });
const analysis = calculateAngoff(exp.data, exp.meta.fields, 'error', 'half_up');
const studentResult = classifyStudents(stu.data, '分數', analysis.thresholds.current.基礎, analysis.thresholds.current.精熟, 35);

const pres = new pptxgen();
pres.defineLayout({ name: 'WIDE_16x9', width: 13.333, height: 7.5 });
pres.layout = 'WIDE_16x9';
pres.author = 'SAAA Angoff Studio';
pres.title = '自然領域 標準設定會議 第一輪分析報告';

const fontFam = 'Microsoft JhengHei';
const dateStr = '2026年10月19日';
const fieldName = '自然';
const roundCn = '一';

const legacy = analysis.legacyThresholds;
const baseAvg = legacy.基礎;
const baseSd = legacy.基礎標準差;
const mastAvg = legacy.精熟;
const mastSd = legacy.精熟標準差;

// Slide 1: 封面
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

// Slide 2: 基礎等級門檻分析
const slide2 = pres.addSlide();
slide2.addText('基礎等級門檻分析 (Cut Score)', {
  x: 1.0, y: 0.4, w: 11.33, h: 0.6,
  fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
});
slide2.addText(
  [
    { text: '基礎等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 14, color: '000000' } },
    { text: `• 基礎 - 1個標準差 (寬鬆門檻)：${baseAvg - baseSd} 題\n`, options: { fontSize: 13, color: '333333' } },
    { text: `• 基礎等級 (平均門檻值)：${baseAvg} 題\n`, options: { fontSize: 13, bold: true, color: '385723' } },
    { text: `• 基礎 + 1個標準差 (嚴格門檻)：${baseAvg + baseSd} 題`, options: { fontSize: 13, color: '333333' } }
  ],
  { x: 1.5, y: 5.8, w: 10.33, h: 1.3, fontFace: fontFam }
);

// Slide 3: 精熟等級門檻分析
const slide3 = pres.addSlide();
slide3.addText('精熟等級門檻分析 (Cut Score)', {
  x: 1.0, y: 0.4, w: 11.33, h: 0.6,
  fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
});
slide3.addText(
  [
    { text: '精熟等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 14, color: '000000' } },
    { text: `• 精熟 - 1個標準差 (寬鬆門檻)：${mastAvg - mastSd} 題\n`, options: { fontSize: 13, color: '333333' } },
    { text: `• 精熟等級 (平均門檻值)：${mastAvg} 題\n`, options: { fontSize: 13, bold: true, color: '385723' } },
    { text: `• 精熟 + 1個標準差 (嚴格門檻)：${mastAvg + mastSd} 題`, options: { fontSize: 13, color: '333333' } }
  ],
  { x: 1.5, y: 5.8, w: 10.33, h: 1.3, fontFace: fontFam }
);

// Slide 4 ~ N: 題目變異數排序表
const varSheet = analysis.varianceSheet;
const itemsPerColumn = 18; // Max 18 rows per column (+ 1 header = 19 rows total)
const itemsPerSlide = itemsPerColumn * 2; // 36 items per slide
const numSlides = Math.ceil(varSheet.length / itemsPerSlide) || 1;

for (let sIdx = 0; sIdx < numSlides; sIdx++) {
  const slide = pres.addSlide();
  slide.addText('題目變異數排序表', {
    x: 1.0, y: 0.35, w: 11.33, h: 0.5,
    fontSize: 22, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

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

  const colWidths = [0.95, 1.25, 1.1, 1.1, 1.2]; // total = 5.6 inches

  if (leftItems.length > 0) {
    slide.addTable(buildTableRows(leftItems), {
      x: 0.85, y: 1.05, w: 5.6,
      colW: colWidths,
      fontSize: 10.5,
      fontFace: fontFam,
      margin: [1.5, 2, 1.5, 2],
      border: { type: 'solid', pt: 0.5, color: '000000' }
    });
  }

  if (rightItems.length > 0) {
    slide.addTable(buildTableRows(rightItems), {
      x: 6.88, y: 1.05, w: 5.6,
      colW: colWidths,
      fontSize: 10.5,
      fontFace: fontFam,
      margin: [1.5, 2, 1.5, 2],
      border: { type: 'solid', pt: 0.5, color: '000000' }
    });
  }
}

// Slide N+1: 學生分布頁
if (studentResult) {
  const slideStu = pres.addSlide();
  slideStu.addText('學生等級比例分布', {
    x: 1.0, y: 0.4, w: 11.33, h: 0.6,
    fontSize: 24, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

  const basicThreshold = Number(studentResult.thresholds.基礎);
  const masteryThreshold = Number(studentResult.thresholds.精熟);
  const nItems = analysis.nItems;

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

await pres.writeFile({ fileName: 'test_wide16x9.pptx' });
console.log('Successfully written test_wide16x9.pptx');
