<template>
  <div v-if="!analysis" class="bg-white rounded-xl p-12 text-center border border-slate-200">
    <AlertCircle class="w-12 h-12 text-slate-400 mx-auto mb-3" />
    <h3 class="text-base font-bold text-slate-700">尚未完成專家分析</h3>
    <p class="text-xs text-slate-500 mt-1">請先至「資料」頁匯入有效之專家評分檔案。</p>
  </div>

  <div v-else class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Controls & Sliders -->
      <div class="lg:col-span-5 space-y-4">
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sliders class="w-5 h-5 text-blue-600" />
            門檻動態模擬
          </h3>

          <!-- Threshold Cards -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-center">
              <span class="text-[11px] font-bold text-amber-800 block mb-0.5">基礎門檻 (模擬值)</span>
              <span class="text-3xl font-extrabold text-amber-700 block">{{ simulatedBase }}</span>
              <span class="text-[11px] text-amber-600 mt-1 block">原始平均 {{ analysis.thresholds.raw.基礎.toFixed(2) }}</span>
            </div>
            <div class="bg-slate-100 border border-slate-300 rounded-xl p-3.5 text-center">
              <span class="text-[11px] font-bold text-slate-700 block mb-0.5">精熟門檻 (模擬值)</span>
              <span class="text-3xl font-extrabold text-slate-800 block">{{ simulatedMastery }}</span>
              <span class="text-[11px] text-slate-500 mt-1 block">原始平均 {{ analysis.thresholds.raw.精熟.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Slider 1: Base Threshold -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs font-semibold">
              <label class="text-slate-700">基礎門檻微調</label>
              <span class="text-amber-700 font-bold text-sm">{{ simulatedBase }} 題</span>
            </div>
            <input
              type="range"
              :min="0"
              :max="analysis.nItems"
              v-model.number="simulatedBase"
              class="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>0 題</span>
              <span>原切點：{{ analysis.thresholds.current.基礎 }}</span>
              <span>{{ analysis.nItems }} 題</span>
            </div>
          </div>

          <!-- Slider 2: Mastery Threshold -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs font-semibold">
              <label class="text-slate-700">精熟門檻微調</label>
              <span class="text-slate-800 font-bold text-sm">{{ simulatedMastery }} 題</span>
            </div>
            <input
              type="range"
              :min="0"
              :max="analysis.nItems"
              v-model.number="simulatedMastery"
              class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
            />
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>0 題</span>
              <span>原切點：{{ analysis.thresholds.current.精熟 }}</span>
              <span>{{ analysis.nItems }} 題</span>
            </div>
          </div>

          <!-- Reset Button -->
          <button
            type="button"
            @click="resetToOriginal"
            class="w-full py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            重設為原始計算門檻 ({{ analysis.thresholds.current.基礎 }} / {{ analysis.thresholds.current.精熟 }})
          </button>

          <!-- Error / Info Status -->
          <div v-if="thresholdError" class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <strong>門檻無效：</strong>{{ thresholdError }}
          </div>
          <div v-else class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs space-y-1">
            <div class="font-bold text-slate-700">原始專家門檻設定：</div>
            <p>基礎：{{ analysis.thresholds.current.基礎 }} 題 · 精熟：{{ analysis.thresholds.current.精熟 }} 題</p>
            <p v-if="!hasStudentData" class="text-amber-600">尚未載入學生資料；門檻仍可自由模擬試算。</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Student Pie Chart -->
      <div class="lg:col-span-7 space-y-4">
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
              <PieChartIcon class="w-5 h-5 text-blue-600" />
              學生等級比例分布 (即時模擬)
            </h3>
            <span v-if="studentResult" class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              總學生：{{ studentResult.totalValid.toLocaleString() }} 人
            </span>
          </div>

          <div v-if="!hasStudentData" class="h-80 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
            <Info class="w-10 h-10 text-slate-300" />
            <p>尚未匯入學生分數資料</p>
            <p class="text-[11px] text-slate-400">請至「資料」頁匯入學生分數檔，以即時預覽圓餅圖分布。</p>
          </div>
          <div v-else-if="thresholdError" class="h-80 flex items-center justify-center text-rose-500 text-xs">
            門檻數值無效，暫停繪製
          </div>
          <div v-else ref="pieChartContainer" class="w-full h-[380px]"></div>
        </div>
      </div>
    </div>

    <!-- Bottom: Custom Classification Table -->
    <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3">
      <h3 class="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
        分類結果矩陣 (對齊評量報告格式)
      </h3>

      <div v-if="!hasStudentData" class="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
        尚未載入學生分類資料。
      </div>
      <div v-else-if="thresholdError" class="p-6 text-center text-rose-500 text-xs bg-rose-50 rounded-lg">
        {{ thresholdError }}
      </div>
      <div v-else class="custom-classification-table-container">
        <table class="custom-classification-table">
          <thead>
            <tr>
              <th style="width: 20%; text-align: center;">最低<br>能力</th>
              <th style="width: 20%; text-align: center;">答對<br>題數</th>
              <th style="width: 20%; text-align: center;">全體</th>
              <th style="width: 20%; text-align: right;">人數</th>
              <th style="width: 20%; text-align: right;">百分比</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;"></td>
              <td style="text-align: center; font-weight: 500;">0 - {{ Math.max(0, simulatedBase - 1) }}</td>
              <td style="text-align: center; color: #2563EB; font-weight: 600;">待加強</td>
              <td style="text-align: right; font-weight: 600;">{{ studentSummary.needs.count.toLocaleString() }}</td>
              <td style="text-align: right; font-weight: 600;">{{ Math.round(studentSummary.needs.pct * 100) }}%</td>
            </tr>
            <tr>
              <td style="text-align: center; vertical-align: middle;">
                <div class="threshold-marker justify-center">
                  <span class="threshold-name">基礎</span>
                  <span class="threshold-box" style="background-color: #F59E0B;">{{ simulatedBase }}</span>
                </div>
              </td>
              <td style="text-align: center; font-weight: 500;">{{ simulatedBase }} - {{ Math.max(simulatedBase, simulatedMastery - 1) }}</td>
              <td style="text-align: center; color: #D97706; font-weight: 600;">基礎</td>
              <td style="text-align: right; font-weight: 600;">{{ studentSummary.basic.count.toLocaleString() }}</td>
              <td style="text-align: right; font-weight: 600;">{{ Math.round(studentSummary.basic.pct * 100) }}%</td>
            </tr>
            <tr>
              <td style="text-align: center; vertical-align: middle;">
                <div class="threshold-marker justify-center">
                  <span class="threshold-name">精熟</span>
                  <span class="threshold-box" style="background-color: #64748B;">{{ simulatedMastery }}</span>
                </div>
              </td>
              <td style="text-align: center; font-weight: 500;">{{ simulatedMastery }} - {{ analysis.nItems }}</td>
              <td style="text-align: center; color: #475569; font-weight: 600;">精熟</td>
              <td style="text-align: right; font-weight: 600;">{{ studentSummary.mastery.count.toLocaleString() }}</td>
              <td style="text-align: right; font-weight: 600;">{{ Math.round(studentSummary.mastery.pct * 100) }}%</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="table-total-row">
              <td colspan="3" style="text-align: center; font-weight: bold; font-size: 1.05rem;">合計</td>
              <td style="text-align: right; font-weight: bold; font-size: 1.05rem;">{{ studentSummary.total.toLocaleString() }}</td>
              <td style="text-align: right; font-weight: bold; font-size: 1.05rem;">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { 
  AlertCircle, 
  Sliders, 
  RotateCcw, 
  PieChart as PieChartIcon, 
  Info 
} from 'lucide-vue-next';
import { classifyStudents } from '../../core/simulation.js';

const props = defineProps({
  analysis: { type: Object, default: null },
  studentData: { type: Array, default: null },
  scoreCol: { type: String, default: '' },
  activeTab: { type: String, default: '' },
  currentSimulatedBase: { type: Number, default: null },
  currentSimulatedMastery: { type: Number, default: null }
});

const emit = defineEmits([
  'update:currentSimulatedBase',
  'update:currentSimulatedMastery',
  'update:studentResult',
  'register-pie-chart'
]);

const simulatedBase = ref(4);
const simulatedMastery = ref(8);
const pieChartContainer = ref(null);
let pieChartRef = null;
let resizeObserver = null;

const hasStudentData = computed(() => {
  return props.studentData && props.studentData.length > 0 && props.scoreCol;
});

const thresholdError = computed(() => {
  if (!props.analysis) return null;
  const base = simulatedBase.value;
  const mast = simulatedMastery.value;
  const max = props.analysis.nItems;

  if (base < 0 || mast > max) return `門檻必須介於 0 與 ${max} 之間。`;
  if (base >= mast) return '基礎門檻必須低於精熟門檻。';
  return null;
});

const studentResult = computed(() => {
  if (!hasStudentData.value || thresholdError.value || !props.analysis) return null;
  try {
    return classifyStudents(
      props.studentData,
      props.scoreCol,
      simulatedBase.value,
      simulatedMastery.value,
      props.analysis.nItems
    );
  } catch (err) {
    return null;
  }
});

const studentSummary = computed(() => {
  if (!studentResult.value) {
    return {
      needs: { count: 0, pct: 0 },
      basic: { count: 0, pct: 0 },
      mastery: { count: 0, pct: 0 },
      total: 0
    };
  }
  const summary = studentResult.value.summary;
  const needs = summary.find(s => s.等級 === '待加強') || { 人數: 0, 百分比: 0 };
  const basic = summary.find(s => s.等級 === '基礎') || { 人數: 0, 百分比: 0 };
  const mastery = summary.find(s => s.等級 === '精熟') || { 人數: 0, 百分比: 0 };

  return {
    needs: { count: needs.人數, pct: needs.百分比 },
    basic: { count: basic.人數, pct: basic.百分比 },
    mastery: { count: mastery.人數, pct: mastery.百分比 },
    total: studentResult.value.totalValid
  };
});

const resetToOriginal = () => {
  if (!props.analysis) return;
  simulatedBase.value = props.analysis.thresholds.current.基礎;
  simulatedMastery.value = props.analysis.thresholds.current.精熟;
};

const updatePieChart = () => {
  if (!hasStudentData.value || thresholdError.value || !pieChartContainer.value || !studentResult.value) {
    if (pieChartRef) pieChartRef.clear();
    return;
  }

  const summary = studentResult.value.summary;
  const pieData = [
    { value: summary.find(s => s.等級 === '待加強')?.人數 || 0, name: '待加強', itemStyle: { color: '#4472C4' } },
    { value: summary.find(s => s.等級 === '基礎')?.人數 || 0, name: '基礎', itemStyle: { color: '#ED7D31' } },
    { value: summary.find(s => s.等級 === '精熟')?.人數 || 0, name: '精熟', itemStyle: { color: '#A5A5A5' } }
  ];

  if (!pieChartRef) {
    pieChartRef = echarts.init(pieChartContainer.value);
  }

  pieChartRef.setOption({
    title: {
      text: '學生等級比例分布',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 18, fontWeight: 'bold', color: '#000000', fontFamily: 'Microsoft JhengHei, sans-serif' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}：{c} 人 ({d}%)'
    },
    legend: {
      bottom: 8,
      data: ['待加強', '基礎', '精熟'],
      textStyle: { fontSize: 12, fontFamily: 'Microsoft JhengHei, sans-serif' }
    },
    series: [
      {
        name: '等級比例',
        type: 'pie',
        radius: ['0%', '72%'],
        center: ['50%', '52%'],
        data: pieData,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#000000',
          lineHeight: 18,
          fontFamily: 'Microsoft JhengHei, sans-serif'
        },
        itemStyle: {
          borderColor: '#FFFFFF',
          borderWidth: 2
        }
      }
    ]
  }, true);

  emit('register-pie-chart', () => {
    return pieChartRef ? pieChartRef.getDataURL({ type: 'png', pixelRatio: 3, backgroundColor: '#ffffff' }) : null;
  });
};

const resizeChart = () => {
  nextTick(() => {
    if (pieChartRef) pieChartRef.resize();
  });
};

watch(() => props.analysis, (newVal) => {
  if (newVal) {
    simulatedBase.value = newVal.thresholds.current.基礎;
    simulatedMastery.value = newVal.thresholds.current.精熟;
  }
}, { immediate: true });

watch([simulatedBase, simulatedMastery], () => {
  emit('update:currentSimulatedBase', simulatedBase.value);
  emit('update:currentSimulatedMastery', simulatedMastery.value);
  emit('update:studentResult', studentResult.value);
  nextTick(() => {
    updatePieChart();
    resizeChart();
  });
});

watch(studentResult, () => {
  emit('update:studentResult', studentResult.value);
  nextTick(() => {
    updatePieChart();
    resizeChart();
  });
});

watch(() => props.activeTab, (newTab) => {
  if (newTab === 'simulation') {
    nextTick(() => {
      updatePieChart();
      resizeChart();
    });
  }
});

onMounted(() => {
  nextTick(() => {
    updatePieChart();

    if (window.ResizeObserver && pieChartContainer.value) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 50) {
            resizeChart();
          }
        }
      });
      resizeObserver.observe(pieChartContainer.value);
    }

    window.addEventListener('resize', resizeChart);
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart);
  if (resizeObserver) resizeObserver.disconnect();
  if (pieChartRef) pieChartRef.dispose();
});
</script>
