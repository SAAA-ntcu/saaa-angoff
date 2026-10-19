<template>
  <div v-if="!analysis" class="bg-white rounded-xl p-12 text-center border border-slate-200">
    <AlertCircle class="w-12 h-12 text-slate-400 mx-auto mb-3" />
    <h3 class="text-base font-bold text-slate-700">尚未完成專家分析</h3>
    <p class="text-xs text-slate-500 mt-1">請先至「資料」頁匯入有效之專家評分檔案。</p>
  </div>

  <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Left Column: Disagreement Bar Chart -->
    <div class="lg:col-span-5 space-y-4">
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div class="border-b border-slate-100 pb-3 mb-3">
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 class="w-4 h-4 text-indigo-600" />
            高爭議題分析 (Top 15)
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">依專家評分之樣本標準差由高至低排列。</p>
        </div>
        <div ref="barChartContainer" class="w-full h-[520px]"></div>
      </div>
    </div>

    <!-- Right Column: Item Statistics Table -->
    <div class="lg:col-span-7 space-y-4">
      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ListOrdered class="w-4 h-4 text-blue-600" />
            題目統計明細表
          </h3>
          <span class="text-xs text-slate-500 font-medium">共 {{ sortedItemStats.length }} 題</span>
        </div>
        <div class="overflow-x-auto max-h-[520px] text-xs">
          <table class="min-w-full divide-y divide-slate-200 border border-slate-200">
            <thead class="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th class="px-2.5 py-2 text-center font-bold text-slate-700 whitespace-nowrap">題號</th>
                <th class="px-2.5 py-2 text-center font-bold text-slate-700 whitespace-nowrap">標準差</th>
                <th class="px-2.5 py-2 text-center font-bold text-slate-700 whitespace-nowrap">有效人數</th>
                <th class="px-2.5 py-2 text-center font-bold text-blue-700 whitespace-nowrap bg-blue-50/50">待加強(人)</th>
                <th class="px-2.5 py-2 text-center font-bold text-blue-700 whitespace-nowrap bg-blue-50/50">待加強(%)</th>
                <th class="px-2.5 py-2 text-center font-bold text-amber-700 whitespace-nowrap bg-amber-50/50">基礎(人)</th>
                <th class="px-2.5 py-2 text-center font-bold text-amber-700 whitespace-nowrap bg-amber-50/50">基礎(%)</th>
                <th class="px-2.5 py-2 text-center font-bold text-slate-700 whitespace-nowrap bg-slate-100/50">精熟(人)</th>
                <th class="px-2.5 py-2 text-center font-bold text-slate-700 whitespace-nowrap bg-slate-100/50">精熟(%)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="item in sortedItemStats" :key="item.題號" class="hover:bg-slate-50">
                <td class="px-2.5 py-1.5 text-center font-bold text-slate-800">{{ item.題號 }}</td>
                <td class="px-2.5 py-1.5 text-center font-semibold text-rose-600">
                  {{ item.標準差 === 0 ? '0' : item.標準差.toFixed(2) }}
                </td>
                <td class="px-2.5 py-1.5 text-center text-slate-600">{{ item.有效人數 }}</td>
                <td class="px-2.5 py-1.5 text-center text-blue-700 bg-blue-50/20">{{ item.待加強人數 }}</td>
                <td class="px-2.5 py-1.5 text-center text-blue-700 bg-blue-50/20">{{ Math.round(item.待加強 * 100) }}%</td>
                <td class="px-2.5 py-1.5 text-center text-amber-700 bg-amber-50/20">{{ item.基礎人數 }}</td>
                <td class="px-2.5 py-1.5 text-center text-amber-700 bg-amber-50/20">{{ Math.round(item.基礎 * 100) }}%</td>
                <td class="px-2.5 py-1.5 text-center text-slate-700 bg-slate-100/20">{{ item.精熟人數 }}</td>
                <td class="px-2.5 py-1.5 text-center text-slate-700 bg-slate-100/20">{{ Math.round(item.精熟 * 100) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { AlertCircle, BarChart2, ListOrdered } from 'lucide-vue-next';

const props = defineProps({
  analysis: { type: Object, default: null }
});

const barChartContainer = ref(null);
let barChartRef = null;

const sortedItemStats = computed(() => {
  if (!props.analysis || !props.analysis.itemStats) return [];
  return [...props.analysis.itemStats].sort((a, b) => {
    if (Math.abs(b.標準差 - a.標準差) > 1e-9) {
      return b.標準差 - a.標準差;
    }
    return a.題號 - b.題號;
  });
});

const initBarChart = () => {
  if (!props.analysis || !barChartContainer.value) return;

  const top15 = sortedItemStats.value.slice(0, 15);
  // Reversing so that highest SD appears at top of horizontal chart
  const reversed = [...top15].reverse();
  const yCategories = reversed.map(i => `第 ${i.題號} 題`);
  const xValues = reversed.map(i => Number(i.標準差.toFixed(3)));

  if (barChartRef) barChartRef.dispose();
  barChartRef = echarts.init(barChartContainer.value);

  barChartRef.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0];
        return `${p.name}<br/>評分標準差：<strong>${p.value}</strong>`;
      }
    },
    grid: {
      top: 20,
      bottom: 30,
      left: 70,
      right: 30
    },
    xAxis: {
      type: 'value',
      name: '標準差',
      splitLine: { lineStyle: { color: '#E2E8F0' } }
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      axisLabel: { fontSize: 11, fontWeight: 'bold' }
    },
    series: [
      {
        name: '標準差',
        type: 'bar',
        data: xValues,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#1D4E89' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#475569'
        }
      }
    ]
  });
};

watch(() => props.analysis, () => {
  nextTick(() => {
    initBarChart();
  });
}, { deep: true });

onMounted(() => {
  nextTick(() => {
    initBarChart();
    window.addEventListener('resize', () => {
      barChartRef && barChartRef.resize();
    });
  });
});
</script>
