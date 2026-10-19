const fs = require('fs');
const path = require('path');

const mockPath = 'C:/Users/adminn/.gemini/antigravity/brain/408f21c7-7bb8-4ee8-8d18-6f563f16f94e/scratch/mock_datasets.json';
const mock = JSON.parse(fs.readFileSync(mockPath, 'utf8'));

const originalExpertCsv = `成員代碼,題號1,題號2,題號3,題號4,題號5,題號6,題號7,題號8,題號9,題號10,題號11,題號12,題號13
A01,1,1,1,1,2,2,2,2,3,3,3,3,3
A02,1,1,1,2,2,2,2,2,3,3,3,3,3
A03,1,1,1,1,1,2,2,2,2,3,3,3,3
A04,1,1,1,2,2,2,2,3,3,3,3,3,3
A05,1,1,1,1,2,2,2,2,2,3,3,3,3
A06,1,1,2,2,2,2,2,2,3,3,3,3,3
A07,1,1,1,1,2,2,2,3,3,3,3,3,3
A08,1,1,1,2,2,2,2,2,2,3,3,3,3`;

const originalStudentCsv = `學生代碼,班級,分數
S001,甲班,13
S002,甲班,11
S003,甲班,10
S004,甲班,9
S005,甲班,8
S006,甲班,7
S007,甲班,6
S008,甲班,5
S009,甲班,4
S010,甲班,3
S011,乙班,11
S012,乙班,10
S013,乙班,10
S014,乙班,9
S015,乙班,8
S016,乙班,8
S017,乙班,7
S018,乙班,7
S019,乙班,6
S020,乙班,5
S021,丙班,12
S022,丙班,11
S023,丙班,9
S024,丙班,9
S025,丙班,8
S026,丙班,7
S027,丙班,6
S028,丙班,5
S029,丙班,4
S030,丙班,2`;

const presets = {
  default: {
    id: 'default',
    title: '標準測試 (8 專家 / 13 題)',
    expertCount: 8,
    itemCount: 13,
    studentCount: 30,
    expertFileName: 'sample_experts_8x13.csv',
    studentFileName: 'sample_students_30.csv',
    expertCsv: originalExpertCsv.trim(),
    studentCsv: originalStudentCsv.trim()
  },
  set_25: {
    id: 'set_25',
    title: '進階模擬 (13 專家 / 25 題)',
    expertCount: 13,
    itemCount: 25,
    studentCount: 80,
    expertFileName: 'mock_experts_13x25.csv',
    studentFileName: 'mock_students_80.csv',
    expertCsv: mock.set_25.expertCsv.trim(),
    studentCsv: mock.set_25.studentCsv.trim()
  },
  set_30: {
    id: 'set_30',
    title: '學力檢測標準版 (13 專家 / 30 題)',
    expertCount: 13,
    itemCount: 30,
    studentCount: 100,
    expertFileName: 'mock_experts_13x30.csv',
    studentFileName: 'mock_students_100.csv',
    expertCsv: mock.set_30.expertCsv.trim(),
    studentCsv: mock.set_30.studentCsv.trim()
  },
  set_35: {
    id: 'set_35',
    title: '大型評量完整版 (13 專家 / 35 題)',
    expertCount: 13,
    itemCount: 35,
    studentCount: 120,
    expertFileName: 'mock_experts_13x35.csv',
    studentFileName: 'mock_students_120.csv',
    expertCsv: mock.set_35.expertCsv.trim(),
    studentCsv: mock.set_35.studentCsv.trim()
  }
};

const code = `// SAAA Angoff Multi-Scale Preset Datasets
export const SAMPLE_EXPERTS_CSV = ${JSON.stringify(originalExpertCsv.trim())};
export const SAMPLE_STUDENTS_CSV = ${JSON.stringify(originalStudentCsv.trim())};

export const PRESET_DATASETS = ${JSON.stringify(presets, null, 2)};
`;

fs.writeFileSync(path.resolve(__dirname, '../src/assets/sampleData.js'), code, 'utf8');
console.log('Successfully generated src/assets/sampleData.js');
