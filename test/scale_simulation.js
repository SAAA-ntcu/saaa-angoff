import os from 'os';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { calculateAngoff } from '../src/core/analysis.js';
import { classifyStudents } from '../src/core/simulation.js';
import { generatePptxReport } from '../src/core/pptxGenerator.js';
import { generateExcelWorkbook } from '../src/core/excelGenerator.js';
import { PRESET_DATASETS } from '../src/assets/sampleData.js';

console.log('========================================================');
console.log('  13 位專家 × 25、30、35 題 標準設定模擬壓力測試');
console.log('========================================================\n');

for (const itemCount of [25, 30, 35]) {
  const setKey = `set_${itemCount}`;
  const data = PRESET_DATASETS[setKey];

  const expertParsed = Papa.parse(data.expertCsv, { header: true, skipEmptyLines: true });
  const studentParsed = Papa.parse(data.studentCsv, { header: true, skipEmptyLines: true });

  const analysis = calculateAngoff(expertParsed.data, expertParsed.meta.fields, 'error', 'half_up');
  const baseCut = analysis.thresholds.current.基礎;
  const mastCut = analysis.thresholds.current.精熟;

  const studentRes = classifyStudents(studentParsed.data, '分數', baseCut, mastCut, itemCount);

  console.log(`【規模：13 位專家 × ${itemCount} 題】`);
  console.log(`- 專家數：${analysis.nExperts} 位 | 題目數：${analysis.nItems} 題`);
  console.log(`- 基礎門檻：${baseCut} 題 (原始平均 ${analysis.thresholds.raw.基礎.toFixed(2)}，標準差 ${analysis.thresholds.standardDeviation.基礎.toFixed(2)})`);
  console.log(`- 精熟門檻：${mastCut} 題 (原始平均 ${analysis.thresholds.raw.精熟.toFixed(2)}，標準差 ${analysis.thresholds.standardDeviation.精熟.toFixed(2)})`);
  console.log(`- 門檻對照值 (基礎 -1/均/+1)：${analysis.legacyThresholds.基礎 - analysis.legacyThresholds.基礎標準差} / ${analysis.legacyThresholds.基礎} / ${analysis.legacyThresholds.基礎 + analysis.legacyThresholds.基礎標準差} 題`);
  console.log(`- 門檻對照值 (精熟 -1/均/+1)：${analysis.legacyThresholds.精熟 - analysis.legacyThresholds.精熟標準差} / ${analysis.legacyThresholds.精熟} / ${analysis.legacyThresholds.精熟 + analysis.legacyThresholds.精熟標準差} 題`);
  console.log(`- 爭議題 Top 3：`);
  analysis.varianceSheet.slice(0, 3).forEach((item, idx) => {
    console.log(`    ${idx + 1}. 第 ${item.題號} 題：SD=${item.標準差} (A=${item.A}, B=${item.B}, C=${item.C})`);
  });

  const stuSummary = studentRes.summary;
  console.log(`- 學生等級分布 (N=${studentRes.totalValid})：`);
  stuSummary.forEach(s => {
    console.log(`    ${s.等級}：${s.人數} 人 (${(s.百分比 * 100).toFixed(1)}%)`);
  });

  // Verify PPTX generation
  const pres = await generatePptxReport({
    fieldName: '數學',
    roundCn: '一',
    analysis,
    studentResult: studentRes
  });
  const tempPptx = path.join(os.tmpdir(), `test_${itemCount}_${Date.now()}.pptx`);
  await pres.writeFile({ fileName: tempPptx });
  const pptxSize = fs.statSync(tempPptx).size;
  fs.unlinkSync(tempPptx);

  // Verify Excel generation
  const excelBuf = await generateExcelWorkbook({
    analysis,
    studentResult: studentRes
  });

  console.log(`- PPTX 生成：成功 (${Math.round(pptxSize / 1024)} KB) | Excel 生成：成功 (${Math.round(excelBuf.byteLength / 1024)} KB)`);
  console.log('--------------------------------------------------------\n');
}

console.log('✅ 25、30、35 題 × 13 位專家 全量規模測試全部成功通過！');
