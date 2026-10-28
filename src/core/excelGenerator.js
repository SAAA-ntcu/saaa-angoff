import ExcelJS from 'exceljs';
import { SAAAMath } from './math.js';

export async function generateExcelWorkbook({ analysis, studentResult = null, audit = {} }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SAAA Angoff Studio';
  wb.created = new Date();

  const applyHeaderStyle = (worksheet) => {
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.font = { name: 'Microsoft JhengHei', bold: true, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC6EFCE' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  };

  const autoFitColumns = (worksheet) => {
    worksheet.columns.forEach(column => {
      let maxLen = 10;
      column.eachCell({ includeEmpty: false }, cell => {
        const str = cell.value !== undefined && cell.value !== null ? String(cell.value) : '';
        if (str.length > maxLen) maxLen = str.length;
      });
      column.width = Math.min(Math.max(maxLen + 3, 10), 30);
    });
  };

  // 1. 工作表1: 題目統計
  const ws1 = wb.addWorksheet('工作表1');
  ws1.columns = [
    { header: '題號', key: '題號' },
    { header: '題目欄位', key: '題目欄位' },
    { header: '標準差', key: '標準差' },
    { header: '有效人數', key: '有效人數' },
    { header: '待加強人數', key: '待加強人數' },
    { header: '基礎人數', key: '基礎人數' },
    { header: '精熟人數', key: '精熟人數' },
    { header: '待加強', key: '待加強' },
    { header: '基礎', key: '基礎' },
    { header: '精熟', key: '精熟' }
  ];
  analysis.itemStats.forEach(item => {
    ws1.addRow({
      題號: item.題號,
      題目欄位: item.題目欄位,
      標準差: item.標準差,
      有效人數: item.有效人數,
      待加強人數: item.待加強人數,
      基礎人數: item.基礎人數,
      精熟人數: item.精熟人數,
      待加強: item.待加強,
      基礎: item.基礎,
      精熟: item.精熟
    });
  });
  applyHeaderStyle(ws1);
  autoFitColumns(ws1);

  // 2. 工作表2: 切截分數表
  const ws2 = wb.addWorksheet('工作表2');
  if (analysis.cutScoreMatrix && analysis.cutScoreMatrix.length > 0) {
    const matrixHeaders = Object.keys(analysis.cutScoreMatrix[0]);
    ws2.columns = matrixHeaders.map(h => ({ header: h, key: h }));
    analysis.cutScoreMatrix.forEach(row => ws2.addRow(row));
    applyHeaderStyle(ws2);
    autoFitColumns(ws2);
  }

  // 3. 變異數
  const ws3 = wb.addWorksheet('變異數');
  ws3.columns = [
    { header: '題號', key: '題號' },
    { header: '標準差', key: '標準差' },
    { header: 'A', key: 'A' },
    { header: 'B', key: 'B' },
    { header: 'C', key: 'C' }
  ];
  analysis.varianceSheet.forEach(row => ws3.addRow(row));
  applyHeaderStyle(ws3);
  autoFitColumns(ws3);

  // 4. 門檻
  const ws4 = wb.addWorksheet('門檻');
  ws4.columns = [
    { header: '等級', key: '等級' },
    { header: '原始平均', key: '原始平均' },
    { header: '當前門檻', key: '當前門檻' },
    { header: '標準差', key: '標準差' }
  ];
  ['基礎', '精熟'].forEach(lvl => {
    ws4.addRow({
      等級: lvl,
      原始平均: analysis.thresholds.raw[lvl],
      當前門檻: analysis.thresholds.current[lvl],
      標準差: analysis.thresholds.standardDeviation[lvl]
    });
  });
  applyHeaderStyle(ws4);
  autoFitColumns(ws4);

  // 5. 學生分布 & 明細 (選填)
  if (studentResult) {
    const ws5 = wb.addWorksheet('學生分布');
    ws5.columns = [
      { header: '等級', key: '等級' },
      { header: '人數', key: '人數' },
      { header: '百分比', key: '百分比' }
    ];
    studentResult.summary.forEach(s => {
      ws5.addRow({
        等級: s.等級,
        人數: s.人數,
        百分比: SAAAMath.formatPercent(s.百分比, 1)
      });
    });
    applyHeaderStyle(ws5);
    autoFitColumns(ws5);

    const ws6 = wb.addWorksheet('學生明細');
    if (studentResult.classified.length > 0) {
      const keys = Object.keys(studentResult.classified[0]);
      ws6.columns = keys.map(k => ({ header: k, key: k }));
      studentResult.classified.forEach(row => ws6.addRow(row));
      applyHeaderStyle(ws6);
      autoFitColumns(ws6);
    }
  }

  // 6. 分析紀錄
  const wsAudit = wb.addWorksheet('分析紀錄');
  wsAudit.columns = [
    { header: '項目', key: '項目' },
    { header: '內容', key: '內容' }
  ];
  const auditRows = [
    { 項目: '產生時間', 內容: new Date().toLocaleString('zh-TW') },
    { 項目: '軟體版本', 內容: 'SAAA Angoff Studio (純前端版)' },
    { 項目: '專家數', 內容: analysis.nExperts },
    { 項目: '題目數', 內容: analysis.nItems },
    { 項目: '缺答政策', 內容: analysis.missingPolicy === 'error' ? '阻止分析' : '排除缺值' },
    { 項目: '取整規則', 內容: analysis.roundingMethod },
    { 項目: '專家資料檔', 內容: audit.expertName || '未記錄' },
    { 項目: '學生資料檔', 內容: audit.studentName || '未提供' }
  ];
  auditRows.forEach(r => wsAudit.addRow(r));
  applyHeaderStyle(wsAudit);
  autoFitColumns(wsAudit);

  return await wb.xlsx.writeBuffer();
}
