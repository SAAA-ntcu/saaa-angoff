<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <!-- Header -->
    <AppHeader :activeTab="activeTab" @update:activeTab="activeTab = $event" />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Tab 1: 資料 -->
      <div v-show="activeTab === 'data'">
        <DataTab
          :expertData="expertData"
          :expertHeaders="expertHeaders"
          :expertFileName="expertFileName"
          :studentData="studentData"
          :studentHeaders="studentHeaders"
          :studentFileName="studentFileName"
          :expertValidation="expertValidation"
          :studentValidation="studentValidation"
          :missingPolicy="missingPolicy"
          :roundingMethod="roundingMethod"
          :itemCount="itemCount"
          :detectedItemCount="detectedItemCount"
          :scoreCol="scoreCol"
          @update:missingPolicy="missingPolicy = $event"
          @update:roundingMethod="roundingMethod = $event"
          @update:itemCount="itemCount = $event"
          @update:scoreCol="scoreCol = $event"
          @load-sample="loadSampleData"
          @upload-expert="handleExpertUpload"
          @upload-student="handleStudentUpload"
        />
      </div>

      <!-- Tab 2: 專家一致性 -->
      <div v-show="activeTab === 'experts'">
        <ExpertsTab
          :analysis="analysis"
          @register-charts="handleRegisterCharts"
        />
      </div>

      <!-- Tab 3: 題目分析 -->
      <div v-show="activeTab === 'items'">
        <ItemsTab :analysis="analysis" />
      </div>

      <!-- Tab 4: 門檻模擬 -->
      <div v-show="activeTab === 'simulation'">
        <SimulationTab
          :analysis="analysis"
          :studentData="studentData"
          :scoreCol="scoreCol"
          :currentSimulatedBase="currentSimulatedBase"
          :currentSimulatedMastery="currentSimulatedMastery"
          @update:currentSimulatedBase="currentSimulatedBase = $event"
          @update:currentSimulatedMastery="currentSimulatedMastery = $event"
          @update:studentResult="studentResult = $event"
          @register-pie-chart="handleRegisterPieChart"
        />
      </div>

      <!-- Tab 5: 報告 -->
      <div v-show="activeTab === 'reports'">
        <ReportsTab
          :analysis="analysis"
          :studentResult="studentResult"
          :expertFileName="expertFileName"
          :studentFileName="studentFileName"
          :currentSimulatedBase="currentSimulatedBase"
          :currentSimulatedMastery="currentSimulatedMastery"
          :getChart1Base64="chartGetters.getChart1Base64"
          :getChart2Base64="chartGetters.getChart2Base64"
          :getPieChartBase64="pieChartGetter"
        />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          國立臺中教育大學 測驗統計與適性學習研究中心 (NTCU IER) · SAAA 標準設定研究團隊
        </div>
        <div class="text-[11px] text-slate-400">
          純前端離線運算架構 · 零個資上傳 · 100% Client-Side Privacy First
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, shallowRef } from 'vue';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import AppHeader from './components/layout/AppHeader.vue';
import DataTab from './components/tabs/DataTab.vue';
import ExpertsTab from './components/tabs/ExpertsTab.vue';
import ItemsTab from './components/tabs/ItemsTab.vue';
import SimulationTab from './components/tabs/SimulationTab.vue';
import ReportsTab from './components/tabs/ReportsTab.vue';

import { SAMPLE_EXPERTS_CSV, SAMPLE_STUDENTS_CSV } from './assets/sampleData.js';
import { validateExpertData, validateStudentData, findScoreColumnCandidates, selectItemColumns } from './core/validation.js';
import { calculateAngoff } from './core/analysis.js';

const activeTab = ref('data');

// Raw Data
const expertData = shallowRef(null);
const expertHeaders = ref([]);
const expertFileName = ref(null);

const studentData = shallowRef(null);
const studentHeaders = ref([]);
const studentFileName = ref(null);

// Settings
const missingPolicy = ref('error');
const roundingMethod = ref('half_up');
const itemCount = ref(0);
const scoreCol = ref('');

// Simulated Thresholds
const currentSimulatedBase = ref(null);
const currentSimulatedMastery = ref(null);
const studentResult = shallowRef(null);

// Chart callbacks for PPTX
const chartGetters = ref({
  getChart1Base64: null,
  getChart2Base64: null
});
const pieChartGetter = ref(null);

const handleRegisterCharts = (getters) => {
  chartGetters.value = getters;
};

const handleRegisterPieChart = (getter) => {
  pieChartGetter.value = getter;
};

// Item counts
const detectedItemCount = computed(() => {
  if (!expertHeaders.value || expertHeaders.value.length === 0) return 0;
  return selectItemColumns(expertHeaders.value, 'auto').length;
});

// Validation
const expertValidation = computed(() => {
  if (!expertData.value) return { valid: false, errors: [], warnings: [] };
  return validateExpertData(
    expertData.value,
    expertHeaders.value,
    missingPolicy.value,
    itemCount.value || 'auto'
  );
});

const studentValidation = computed(() => {
  if (!studentData.value) return { valid: false, errors: [], warnings: [] };
  const maxScore = expertValidation.value.valid ? expertValidation.value.numItems : null;
  return validateStudentData(studentData.value, scoreCol.value, maxScore);
});

// Central Angoff Analysis
const analysis = computed(() => {
  if (!expertValidation.value.valid) return null;
  try {
    return calculateAngoff(
      expertData.value,
      expertHeaders.value,
      missingPolicy.value,
      roundingMethod.value,
      itemCount.value || 'auto'
    );
  } catch (err) {
    console.error('Angoff calculation error:', err);
    return null;
  }
});

// File parser helper for CSV / Excel
const parseFile = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          resolve({ rows: res.data, headers: res.meta.fields || [] });
        },
        error: reject
      });
    });
  } else if (['xlsx', 'xls'].includes(extension)) {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || [];
    return { rows: json, headers: headers.map(String) };
  } else {
    throw new Error('僅支援 .csv, .xlsx, .xls 檔案格式');
  }
};

const handleExpertUpload = async (file) => {
  try {
    const res = await parseFile(file);
    expertData.value = res.rows;
    expertHeaders.value = res.headers;
    expertFileName.value = file.name;
    const detected = selectItemColumns(res.headers, 'auto').length;
    itemCount.value = detected;
  } catch (err) {
    alert('專家評分讀取失敗：' + err.message);
  }
};

const handleStudentUpload = async (file) => {
  try {
    const res = await parseFile(file);
    studentData.value = res.rows;
    studentHeaders.value = res.headers;
    studentFileName.value = file.name;
    const candidates = findScoreColumnCandidates(res.headers);
    if (candidates.length > 0) {
      scoreCol.value = candidates[0];
    } else {
      scoreCol.value = '';
    }
  } catch (err) {
    alert('學生分數讀取失敗：' + err.message);
  }
};

const loadSampleData = () => {
  const expRes = Papa.parse(SAMPLE_EXPERTS_CSV, { header: true, skipEmptyLines: true });
  expertData.value = expRes.data;
  expertHeaders.value = expRes.meta.fields || [];
  expertFileName.value = 'sample_experts.csv';
  itemCount.value = selectItemColumns(expertHeaders.value, 'auto').length;

  const stuRes = Papa.parse(SAMPLE_STUDENTS_CSV, { header: true, skipEmptyLines: true });
  studentData.value = stuRes.data;
  studentHeaders.value = stuRes.meta.fields || [];
  studentFileName.value = 'sample_students.csv';
  scoreCol.value = '分數';
};
</script>
