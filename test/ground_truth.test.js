import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { calculateAngoff } from '../src/core/analysis.js';
import { classifyStudents } from '../src/core/simulation.js';
import { SAAAMath } from '../src/core/math.js';
import { generatePptxReport } from '../src/core/pptxGenerator.js';
import { generateExcelWorkbook } from '../src/core/excelGenerator.js';
import { generateHtmlReport } from '../src/core/htmlReportGenerator.js';
import ExcelJS from 'exceljs';
import { findScoreColumnCandidates, selectItemColumns } from '../src/core/validation.js';
import { VARIANCE_ITEMS_PER_SLIDE } from '../src/core/constants.js';
import { buildPieChartOption } from '../src/core/chartRenderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expertCsvPath = path.resolve(__dirname, '../public/sample_experts.csv');
const studentCsvPath = path.resolve(__dirname, '../public/sample_students.csv');

const expertContent = fs.readFileSync(expertCsvPath, 'utf-8');
const studentContent = fs.readFileSync(studentCsvPath, 'utf-8');

const expertParsed = Papa.parse(expertContent, { header: true, skipEmptyLines: true });
const studentParsed = Papa.parse(studentContent, { header: true, skipEmptyLines: true });

console.log('=== SAAA Angoff Studio Ground Truth & Document Synthesis Tests ===');

console.log('1. Checking Expert & Item counts...');
const analysis = calculateAngoff(expertParsed.data, expertParsed.meta.fields, 'error', 'half_up');
if (analysis.nExperts !== 8) throw new Error(`Expected 8 experts, got ${analysis.nExperts}`);
if (analysis.nItems !== 13) throw new Error(`Expected 13 items, got ${analysis.nItems}`);

console.log('2. Checking Thresholds (Raw & Half-Up)...');
if (Math.abs(analysis.thresholds.raw.基礎 - 3.5) > 1e-6) throw new Error(`Basic raw mean mismatch`);
if (Math.abs(analysis.thresholds.raw.精熟 - 8.125) > 1e-6) throw new Error(`Mastery raw mean mismatch`);
if (analysis.thresholds.current.基礎 !== 4) throw new Error(`Basic current threshold mismatch`);
if (analysis.thresholds.current.精熟 !== 8) throw new Error(`Mastery current threshold mismatch`);

console.log('3. Checking Standard Deviations...');
if (Math.abs(analysis.thresholds.standardDeviation.基礎 - 0.9258201) > 1e-6) throw new Error(`Basic SD mismatch`);
if (Math.abs(analysis.thresholds.standardDeviation.精熟 - 0.8345230) > 1e-6) throw new Error(`Mastery SD mismatch`);

console.log('4. Checking Item Disagreement ranking...');
if (analysis.varianceSheet[0].題號 !== 4 || analysis.varianceSheet[0].標準差 !== '0.53') throw new Error(`Top item mismatch: expected item 4 with SD 0.53`);
if (analysis.varianceSheet[1].題號 !== 9 || analysis.varianceSheet[1].標準差 !== '0.52') throw new Error(`Second item mismatch: expected item 9 with SD 0.52`);

console.log('5. Checking Student Classification...');
const studentRes = classifyStudents(studentParsed.data, '分數', 4, 8, 13);
const counts = studentRes.summary.map(s => s.人數);
if (counts[0] !== 2 || counts[1] !== 12 || counts[2] !== 16) {
  throw new Error(`Student counts mismatch: expected [2, 12, 16], got ${JSON.stringify(counts)}`);
}

console.log('6. Checking Rounding Methods...');
if (SAAAMath.roundCutScore(2.5, 'half_up') !== 3) throw new Error('Half up failed');
if (SAAAMath.roundCutScore(2.5, 'bankers') !== 2) throw new Error('Bankers failed');
if (SAAAMath.roundToEven(3.5) !== 4 || SAAAMath.roundToEven(-2.5) !== -2) throw new Error('R tie-to-even rounding failed');
if (SAAAMath.roundCutScore(2.1, 'ceiling') !== 3) throw new Error('Ceiling failed');
if (SAAAMath.roundCutScore(2.9, 'floor') !== 2) throw new Error('Floor failed');

console.log('7. Checking Excel Workbook Synthesis (ExcelJS)...');
const excelBuffer = await generateExcelWorkbook({
  analysis,
  studentResult: studentRes,
  audit: { expertName: 'sample_experts.csv', studentName: 'sample_students.csv' }
});
if (!excelBuffer || excelBuffer.byteLength < 5000) {
  throw new Error('Excel workbook generation failed');
}

console.log('8. Checking Standalone HTML Report Synthesis...');
const htmlContent = generateHtmlReport({ analysis, studentResult: studentRes });
if (!htmlContent || !htmlContent.includes('Angoff Studio 分析報告') || !htmlContent.includes('學生分布')) {
  throw new Error('HTML report generation failed');
}

console.log('9. Checking 16:9 PowerPoint Presentation Synthesis (PptxGenJS)...');
const pres = await generatePptxReport({
  fieldName: '自然',
  roundCn: '一',
  analysis,
  studentResult: studentRes
});
const pptxTestFile = path.resolve(__dirname, 'temp_test.pptx');
await pres.writeFile({ fileName: pptxTestFile });
if (fs.existsSync(pptxTestFile)) {
  fs.unlinkSync(pptxTestFile);
} else {
  throw new Error('PPTX generation failed');
}

console.log('10. Checking r-angoff rounding and missing-rating parity...');
const tieHeaders = ['成員代碼', '題號1', '題號2', '題號3', '題號4', '題號5'];
const tieRows = [
  { 成員代碼: 'A01', 題號1: 1, 題號2: 1, 題號3: 2, 題號4: 3, 題號5: 3 },
  { 成員代碼: 'A02', 題號1: 1, 題號2: 1, 題號3: 1, 題號4: 2, 題號5: 3 }
];
const tieAnalysis = calculateAngoff(tieRows, tieHeaders, 'error', 'half_up');
if (tieAnalysis.thresholds.raw.基礎 !== 2.5 || tieAnalysis.thresholds.current.基礎 !== 3) {
  throw new Error('Half-up threshold rounding diverges from r-angoff');
}
if (tieAnalysis.legacyThresholds.基礎 !== 2 || tieAnalysis.cutScoreMatrix[0].平均數 !== 2) {
  throw new Error('R-compatible tie-to-even summary rounding failed');
}

const partialRows = [
  { 成員代碼: 'A01', 題號1: 1, 題號2: 'BLANK' },
  { 成員代碼: 'A02', 題號1: 2, 題號2: 'BLANK' },
  { 成員代碼: 'A03', 題號1: 3, 題號2: 2 }
];
const partialAnalysis = calculateAngoff(
  partialRows,
  ['成員代碼', '題號1', '題號2'],
  'exclude',
  'half_up'
);
if (partialAnalysis.nItems !== 2 || partialAnalysis.itemStats.length !== 1 || partialAnalysis.itemStats[0].題號 !== 1) {
  throw new Error('Items with fewer than two ratings must be omitted from item statistics like r-angoff');
}
const partialWorkbook = new ExcelJS.Workbook();
await partialWorkbook.xlsx.load(await generateExcelWorkbook({ analysis: partialAnalysis }));
if (partialWorkbook.getWorksheet('門檻').getCell('B2').value !== partialAnalysis.thresholds.raw.基礎) {
  throw new Error('Excel must retain full precision for raw thresholds');
}

console.log('11. Checking import inference and percentage formatting parity...');
const fallbackColumns = findScoreColumnCandidates(
  ['student_id', 'final_value'],
  [{ student_id: 'S001', final_value: '3' }, { student_id: 'S002', final_value: '2' }]
);
if (fallbackColumns.length !== 1 || fallbackColumns[0] !== 'final_value') {
  throw new Error(`Numeric score-column fallback mismatch: ${JSON.stringify(fallbackColumns)}`);
}
const whitespaceScoreResult = classifyStudents(
  [{ 分數: ' ' }, { 分數: '2' }],
  '分數',
  1,
  2,
  2
);
if (whitespaceScoreResult.totalValid !== 1 || whitespaceScoreResult.warnings.length !== 1) {
  throw new Error('Whitespace-only student scores must be excluded like missing R values');
}
const unsortedItemHeaders = ['題號10', '題號2', '題號1'];
if (selectItemColumns(unsortedItemHeaders, 'auto').join(',') !== unsortedItemHeaders.join(',')) {
  throw new Error('Automatic item selection should preserve source column order');
}
if (selectItemColumns(unsortedItemHeaders, 2).join(',') !== '題號1,題號2') {
  throw new Error('Explicit item-count selection should sort item numbers like r-angoff');
}

const percentageRows = Array.from({ length: 8 }, (_, i) => ({
  成員代碼: `A${String(i + 1).padStart(2, '0')}`,
  題號1: i === 0 ? 1 : 3,
  題號2: 2
}));
const percentageAnalysis = calculateAngoff(
  percentageRows,
  ['成員代碼', '題號1', '題號2'],
  'error',
  'half_up'
);
if (percentageAnalysis.varianceSheet[0].A !== '12%') {
  throw new Error(`Expected r-angoff tie-to-even item percentage of 12%, got ${percentageAnalysis.varianceSheet[0].A}`);
}
const pieOption = buildPieChartOption([
  { 等級: '待加強', 人數: 1, 百分比: 0.125 },
  { 等級: '基礎', 人數: 0, 百分比: 0 },
  { 等級: '精熟', 人數: 7, 百分比: 0.875 }
]);
if (pieOption.series[0].label.formatter({ name: '待加強', percent: 12.5 }) !== '待加強\n12%') {
  throw new Error('Pie chart percentage label does not match r-angoff rounding');
}

console.log('12. Checking that Excel, PPTX and presentation pagination share the same results...');
const tieStudentRows = Array.from({ length: 16 }, (_, i) => ({
  學生代碼: `S${String(i + 1).padStart(3, '0')}`,
  分數: i === 0 ? 0 : 4
}));
const tieStudentResult = classifyStudents(tieStudentRows, '分數', 3, 4, 5);
const parityWorkbook = new ExcelJS.Workbook();
await parityWorkbook.xlsx.load(await generateExcelWorkbook({
  analysis: tieAnalysis,
  studentResult: tieStudentResult
}));
if (parityWorkbook.getWorksheet('學生分布').getCell('C2').value !== '6.2%') {
  throw new Error('Excel student percentage should use the r-angoff one-decimal tie-to-even format');
}
const tiePptx = await generatePptxReport({
  fieldName: '自然',
  roundCn: '一',
  analysis: tieAnalysis,
  studentResult: classifyStudents(
    Array.from({ length: 8 }, (_, i) => ({ 分數: i === 0 ? 0 : 4 })),
    '分數',
    3,
    4,
    5
  )
});
const tiePptxText = JSON.stringify(tiePptx._slides);
if (!tiePptxText.includes('12%') || tiePptxText.includes('13%')) {
  throw new Error('PPTX student percentages should match r-angoff integer tie-to-even formatting');
}
if (VARIANCE_ITEMS_PER_SLIDE !== 38) {
  throw new Error(`Expected 38 item rows per variance slide, got ${VARIANCE_ITEMS_PER_SLIDE}`);
}
const longVarianceAnalysis = {
  ...tieAnalysis,
  nItems: 35,
  varianceSheet: Array.from({ length: 35 }, (_, i) => ({
    題號: i + 1,
    標準差: '0.50',
    A: '25%',
    B: '50%',
    C: '25%'
  }))
};
const longReport = await generatePptxReport({
  fieldName: '自然',
  roundCn: '一',
  analysis: longVarianceAnalysis
});
if (longReport._slides.length !== 4) {
  throw new Error(`r-angoff pagination should fit 35 items on one variance slide; got ${longReport._slides.length} total slides`);
}

console.log('🎉 ALL GROUND TRUTH, R-ANGOFF PARITY, AND DOCUMENT SYNTHESIS TESTS PASSED!');
