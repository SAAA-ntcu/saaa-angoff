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

console.log('🎉 ALL GROUND TRUTH & DOCUMENT SYNTHESIS TESTS PASSED (100% PARITY)!');
