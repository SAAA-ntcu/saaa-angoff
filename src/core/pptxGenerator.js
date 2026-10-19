import pptxgen from 'pptxgenjs';

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
  pres.layout = 'LAYOUT_16x9';
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

  // ==========================================
  // Slide 1: 封面
  // ==========================================
  const slide1 = pres.addSlide();
  slide1.addText(
    [
      { text: `${fieldName}領域\n`, options: { fontSize: 44, bold: true, color: '1B365D' } },
      { text: '標準設定會議', options: { fontSize: 44, bold: true, color: '1B365D' } }
    ],
    { x: '10%', y: '18%', w: '80%', h: '30%', align: 'center', fontFace: fontFam }
  );

  slide1.addText(
    [
      { text: `第${roundCn}輪專家評分結果分析報告\n\n`, options: { fontSize: 24, bold: true, color: '595959' } },
      { text: `會議日期：${dateStr}`, options: { fontSize: 14, color: '7F7F7F' } }
    ],
    { x: '10%', y: '55%', w: '80%', h: '25%', align: 'center', fontFam: fontFam }
  );

  // ==========================================
  // Slide 2: 基礎等級門檻分析 (Cut Score)
  // ==========================================
  const slide2 = pres.addSlide();
  slide2.addText('基礎等級門檻分析 (Cut Score)', {
    x: '5%', y: '4%', w: '90%', h: '8%',
    fontSize: 22, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

  if (chart1Base64) {
    slide2.addImage({
      data: chart1Base64,
      x: '5%', y: '14%', w: '90%', h: '58%'
    });
  }

  slide2.addText(
    [
      { text: '基礎等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 13, color: '000000' } },
      { text: `• 基礎 - 1個標準差 (寬鬆門檻)：${baseAvg - baseSd} 題\n`, options: { fontSize: 13, color: '333333' } },
      { text: `• 基礎等級 (平均門檻值)：${baseAvg} 題\n`, options: { fontSize: 13, bold: true, color: '385723' } },
      { text: `• 基礎 + 1個標準差 (嚴格門檻)：${baseAvg + baseSd} 題`, options: { fontSize: 13, color: '333333' } }
    ],
    { x: '5%', y: '74%', w: '90%', h: '22%', fontFace: fontFam }
  );

  // ==========================================
  // Slide 3: 精熟等級門檻分析 (Cut Score)
  // ==========================================
  const slide3 = pres.addSlide();
  slide3.addText('精熟等級門檻分析 (Cut Score)', {
    x: '5%', y: '4%', w: '90%', h: '8%',
    fontSize: 22, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
  });

  if (chart2Base64) {
    slide3.addImage({
      data: chart2Base64,
      x: '5%', y: '14%', w: '90%', h: '58%'
    });
  }

  slide3.addText(
    [
      { text: '精熟等級通過門檻對照值 (平均數 ± 1個標準差)：\n', options: { bold: true, fontSize: 13, color: '000000' } },
      { text: `• 精熟 - 1個標準差 (寬鬆門檻)：${mastAvg - mastSd} 題\n`, options: { fontSize: 13, color: '333333' } },
      { text: `• 精熟等級 (平均門檻值)：${mastAvg} 題\n`, options: { fontSize: 13, bold: true, color: '385723' } },
      { text: `• 精熟 + 1個標準差 (嚴格門檻)：${mastAvg + mastSd} 題`, options: { fontSize: 13, color: '333333' } }
    ],
    { x: '5%', y: '74%', w: '90%', h: '22%', fontFace: fontFam }
  );

  // ==========================================
  // Slide 4 ~ N: 題目變異數排序表
  // ==========================================
  const varSheet = analysis.varianceSheet;
  const itemsPerColumn = 19;
  const itemsPerSlide = itemsPerColumn * 2;
  const numSlides = Math.ceil(varSheet.length / itemsPerSlide) || 1;

  for (let sIdx = 0; sIdx < numSlides; sIdx++) {
    const slide = pres.addSlide();
    slide.addText('題目變異數排序表', {
      x: '5%', y: '3%', w: '90%', h: '6%',
      fontSize: 20, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
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
          { text: '題號', options: { bold: true, fill: 'C6EFCE', align: 'center' } },
          { text: '變異數', options: { bold: true, fill: 'C6EFCE', align: 'center' } },
          { text: 'A', options: { bold: true, fill: 'C6EFCE', align: 'center' } },
          { text: 'B', options: { bold: true, fill: 'C6EFCE', align: 'center' } },
          { text: 'C', options: { bold: true, fill: 'C6EFCE', align: 'center' } }
        ]
      ];
      items.forEach((item, rIdx) => {
        const bg = rIdx % 2 === 1 ? 'E6E6E6' : 'FFFFFF';
        rows.push([
          { text: String(item.題號), options: { align: 'center', fill: bg } },
          { text: String(item.標準差), options: { align: 'center', fill: bg } },
          { text: String(item.A), options: { align: 'center', fill: bg } },
          { text: String(item.B), options: { align: 'center', fill: bg } },
          { text: String(item.C), options: { align: 'center', fill: bg } }
        ]);
      });
      return rows;
    };

    if (leftItems.length > 0) {
      slide.addTable(buildTableRows(leftItems), {
        x: '4%', y: '10%', w: '44%',
        fontSize: 11, fontFace: fontFam,
        border: { pt: 0.5, color: '000000' }
      });
    }

    if (rightItems.length > 0) {
      slide.addTable(buildTableRows(rightItems), {
        x: '52%', y: '10%', w: '44%',
        fontSize: 11, fontFace: fontFam,
        border: { pt: 0.5, color: '000000' }
      });
    }
  }

  // ==========================================
  // Slide N+1: 學生分布頁 (若有學生資料)
  // ==========================================
  if (studentResult) {
    const slideStu = pres.addSlide();
    slideStu.addText('學生等級比例分布', {
      x: '5%', y: '4%', w: '90%', h: '8%',
      fontSize: 22, bold: true, color: '1B365D', align: 'center', fontFace: fontFam
    });

    if (pieChartBase64) {
      slideStu.addImage({
        data: pieChartBase64,
        x: '5%', y: '16%', w: '42%', h: '72%'
      });
    }

    const basicThreshold = Number(studentResult.thresholds.基礎);
    const masteryThreshold = Number(studentResult.thresholds.精熟);
    const nItems = analysis.nItems;

    // Threshold indicator boxes
    slideStu.addShape(pres.ShapeType.rect, {
      x: '50%', y: '16%', w: '20%', h: '8%',
      fill: { color: 'F59E0B' },
      line: { color: 'D97706', width: 1 }
    });
    slideStu.addText(`基礎門檻：${basicThreshold} 題`, {
      x: '50%', y: '16%', w: '20%', h: '8%',
      fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', fontFace: fontFam
    });

    slideStu.addShape(pres.ShapeType.rect, {
      x: '73%', y: '16%', w: '22%', h: '8%',
      fill: { color: '64748B' },
      line: { color: '475569', width: 1 }
    });
    slideStu.addText(`精熟門檻：${masteryThreshold} 題`, {
      x: '73%', y: '16%', w: '22%', h: '8%',
      fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', fontFace: fontFam
    });

    // 5x5 Formatted Table
    const summary = studentResult.summary;
    const needsRow = summary.find(s => s.等級 === '待加強') || { 人數: 0, 百分比: 0 };
    const basicRow = summary.find(s => s.等級 === '基礎') || { 人數: 0, 百分比: 0 };
    const mastRow = summary.find(s => s.等級 === '精熟') || { 人數: 0, 百分比: 0 };
    const totalCount = studentResult.totalValid;

    const stuRows = [
      [
        { text: '最低能力', options: { bold: true, fill: 'C6EFCE', align: 'center' } },
        { text: '答對題數', options: { bold: true, fill: 'C6EFCE', align: 'center' } },
        { text: '全體', options: { bold: true, fill: 'C6EFCE', align: 'center' } },
        { text: '人數', options: { bold: true, fill: 'C6EFCE', align: 'right' } },
        { text: '百分比', options: { bold: true, fill: 'C6EFCE', align: 'right' } }
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
        { text: '合計', options: { colspan: 3, bold: true, align: 'center', fill: 'F1F5F9' } },
        { text: totalCount.toLocaleString(), options: { bold: true, align: 'right', fill: 'F1F5F9' } },
        { text: '100%', options: { bold: true, align: 'right', fill: 'F1F5F9' } }
      ]
    ];

    slideStu.addTable(stuRows, {
      x: '50%', y: '28%', w: '45%',
      fontSize: 13, fontFace: fontFam,
      border: { pt: 0.5, color: '000000' }
    });
  }

  return pres;
}
