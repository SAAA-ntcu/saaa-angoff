<template>
  <div v-if="!analysis" class="bg-white rounded-xl p-12 text-center border border-slate-200">
    <AlertCircle class="w-12 h-12 text-slate-400 mx-auto mb-3" />
    <h3 class="text-base font-bold text-slate-700">尚未完成專家分析</h3>
    <p class="text-xs text-slate-500 mt-1">請先至「資料」頁匯入有效之專家評分檔案。</p>
  </div>

  <div v-else class="space-y-6">
    <!-- 4 Metric Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="專家數"
        :value="analysis.nExperts"
        note="通過資料驗證"
        accentColor="#1D4E89"
      />
      <MetricCard
        label="題目數"
        :value="analysis.nItems"
        note="納入標準設定"
        accentColor="#0F766E"
      />
      <MetricCard
        label="基礎門檻"
        :value="analysis.thresholds.current.基礎"
        :note="`原始平均 ${analysis.thresholds.raw.基礎.toFixed(2)}`"
        accentColor="#F59E0B"
      />
      <MetricCard
        label="精熟門檻"
        :value="analysis.thresholds.current.精熟"
        :note="`原始平均 ${analysis.thresholds.raw.精熟.toFixed(2)}`"
        accentColor="#64748B"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart 1: Basic Consistency -->
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-amber-600" />
            基礎門檻一致性
          </h3>
          <button
            @click="downloadChartPng(chart1Ref, '各委員預估達基礎最低題數.png')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            下載圖表 PNG
          </button>
        </div>
        <!-- High resolution chart container -->
        <div ref="chart1Container" class="w-full h-[400px]"></div>
      </div>

      <!-- Chart 2: Mastery Consistency -->
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Award class="w-4 h-4 text-blue-600" />
            精熟門檻一致性
          </h3>
          <button
            @click="downloadChartPng(chart2Ref, '各委員預估達精熟最低題數.png')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            下載圖表 PNG
          </button>
        </div>
        <!-- High resolution chart container -->
        <div ref="chart2Container" class="w-full h-[400px]"></div>
      </div>
    </div>

    <!-- Tables Row -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: Expert Cut Scores Matrix -->
      <div class="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3">
          專家明細矩陣
        </h3>
        <div class="overflow-x-auto text-xs">
          <table class="min-w-full divide-y divide-slate-200 border border-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th v-for="col in cutScoreHeaders" :key="col" class="px-3 py-2 text-center font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="(row, rIdx) in analysis.cutScoreMatrix" :key="rIdx" class="hover:bg-slate-50">
                <td v-for="col in cutScoreHeaders" :key="col" :class="['px-3 py-1.5 text-center whitespace-nowrap', col === '指標' ? 'font-semibold text-slate-800 bg-slate-50/50' : 'text-slate-600']">
                  {{ row[col] !== undefined ? row[col] : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Threshold Comparison Table & Explanation -->
      <div class="lg:col-span-5 space-y-4">
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3">
            門檻對照表 (平均數 ± 1個標準差)
          </h3>
          <div class="overflow-x-auto text-xs">
            <table class="min-w-full divide-y divide-slate-200 border border-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-3 py-2 text-center font-bold text-slate-700">等級</th>
                  <th class="px-3 py-2 text-center font-bold text-slate-700">指標</th>
                  <th class="px-3 py-2 text-center font-bold text-slate-700">分數</th>
                  <th class="px-3 py-2 text-left font-bold text-slate-700">說明</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="(row, idx) in thresholdComparison" :key="idx" class="hover:bg-slate-50">
                  <td class="px-3 py-1.5 text-center font-semibold text-slate-800">{{ row.等級 }}</td>
                  <td class="px-3 py-1.5 text-center text-slate-600">{{ row.指標 }}</td>
                  <td class="px-3 py-1.5 text-center font-bold text-blue-700">{{ row.分數 }}</td>
                  <td class="px-3 py-1.5 text-left text-slate-500 text-[11px]">{{ row.說明 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-xs text-blue-900 space-y-1.5">
          <div class="font-bold flex items-center gap-1.5">
            <Info class="w-4 h-4 text-blue-600" />
            判讀與決策方式
          </div>
          <p class="leading-relaxed text-slate-600">
            藍點為各委員評定之最低題數；三條水平線為平均門檻及正負一個標準差。由上至下依序為 <span class="font-semibold text-amber-600">+1個標準差 (嚴格門檻)</span>、<span class="font-semibold text-slate-700">平均門檻值</span>、<span class="font-semibold text-amber-500">-1個標準差 (寬鬆門檻)</span>。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { 
  AlertCircle, 
  TrendingUp, 
  Award, 
  Download, 
  Info 
} from 'lucide-vue-next';
import MetricCard from '../layout/MetricCard.vue';
import { buildThresholdComparison } from '../../core/analysis.js';
import { buildConsistencyChartOption } from '../../core/chartRenderer.js';

const props = defineProps({
  analysis: { type: Object, default: null },
  activeTab: { type: String, default: '' }
});

const emit = defineEmits(['register-charts']);

const chart1Container = ref(null);
const chart2Container = ref(null);
let chart1Ref = null;
let chart2Ref = null;
let resizeObserver = null;

const cutScoreHeaders = computed(() => {
  if (!props.analysis || !props.analysis.cutScoreMatrix || props.analysis.cutScoreMatrix.length === 0) return [];
  return Object.keys(props.analysis.cutScoreMatrix[0]);
});

const thresholdComparison = computed(() => {
  if (!props.analysis) return [];
  return buildThresholdComparison(props.analysis);
});

const initCharts = () => {
  if (!props.analysis) return;

  const legacy = props.analysis.legacyThresholds;
  const expertScores1 = props.analysis.expertStats.map(e => e.基礎切截分數);
  const expertScores2 = props.analysis.expertStats.map(e => e.精熟切截分數);

  if (chart1Container.value) {
    if (!chart1Ref) {
      chart1Ref = echarts.init(chart1Container.value);
    }
    chart1Ref.setOption(buildConsistencyChartOption('基礎', expertScores1, legacy.基礎, legacy.基礎標準差), true);
  }

  if (chart2Container.value) {
    if (!chart2Ref) {
      chart2Ref = echarts.init(chart2Container.value);
    }
    chart2Ref.setOption(buildConsistencyChartOption('精熟', expertScores2, legacy.精熟, legacy.精熟標準差), true);
  }

  emit('register-charts', {
    getChart1Base64: () => chart1Ref ? chart1Ref.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#ffffff' }) : null,
    getChart2Base64: () => chart2Ref ? chart2Ref.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#ffffff' }) : null
  });
};

const resizeAllCharts = () => {
  nextTick(() => {
    if (chart1Ref) chart1Ref.resize();
    if (chart2Ref) chart2Ref.resize();
  });
};

const downloadChartPng = (chartInstance, fileName) => {
  if (!chartInstance) return;
  // 300 DPI high resolution export
  const dataUrl = chartInstance.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#ffffff' });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Re-render when analysis changes
watch(() => props.analysis, () => {
  nextTick(() => {
    initCharts();
    resizeAllCharts();
  });
}, { deep: true });

// Crucial: trigger resize when activeTab switches to 'experts'
watch(() => props.activeTab, (newTab) => {
  if (newTab === 'experts') {
    nextTick(() => {
      initCharts();
      resizeAllCharts();
    });
  }
});

onMounted(() => {
  nextTick(() => {
    initCharts();

    // Use ResizeObserver on chart container for flawless responsive layout
    if (window.ResizeObserver && chart1Container.value) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 50) {
            resizeAllCharts();
          }
        }
      });
      resizeObserver.observe(chart1Container.value);
      if (chart2Container.value) resizeObserver.observe(chart2Container.value);
    }

    window.addEventListener('resize', resizeAllCharts);
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeAllCharts);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (chart1Ref) chart1Ref.dispose();
  if (chart2Ref) chart2Ref.dispose();
});
</script>
