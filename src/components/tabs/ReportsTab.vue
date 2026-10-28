<template>
  <div v-if="!analysis" class="bg-white rounded-xl p-12 text-center border border-slate-200">
    <AlertCircle class="w-12 h-12 text-slate-400 mx-auto mb-3" />
    <h3 class="text-base font-bold text-slate-700">尚未完成專家分析</h3>
    <p class="text-xs text-slate-500 mt-1">請先至「資料」頁匯入有效之專家評分檔案。</p>
  </div>

  <div v-else class="space-y-6">
    <!-- Top Row: Downloads & Settings -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left: Download Actions & PPT Settings -->
      <div class="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <DownloadCloud class="w-5 h-5 text-blue-600" />
            匯出專業分析報告
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            學生分布與等級將套用「門檻模擬」頁目前設定之門檻 (基礎: {{ effectiveThresholds.基礎 }} 題 · 精熟: {{ effectiveThresholds.精熟 }} 題)。
          </p>
        </div>

        <!-- Excel & HTML Buttons -->
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            @click="exportExcel"
            class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet class="w-4 h-4" />
            下載 Excel 分析檔 (.xlsx)
          </button>
          <button
            type="button"
            @click="exportHtml"
            class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300 flex items-center gap-2"
          >
            <FileCode class="w-4 h-4" />
            下載 HTML 報告 (.html)
          </button>
        </div>

        <div class="border-t border-slate-100 pt-4 space-y-4">
          <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Presentation class="w-4 h-4 text-indigo-600" />
            PowerPoint 簡報設定
          </h4>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">領域</label>
              <select
                v-model="pptxField"
                class="w-full text-xs rounded-lg border-slate-200 p-2 border focus:border-blue-500 font-medium"
              >
                <option value="S">自然</option>
                <option value="C">國語文</option>
                <option value="M">數學</option>
                <option value="E">英語文</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">輪次</label>
              <select
                v-model="pptxRound"
                class="w-full text-xs rounded-lg border-slate-200 p-2 border focus:border-blue-500 font-medium"
              >
                <option :value="1">第 1 輪</option>
                <option :value="2">第 2 輪</option>
                <option :value="3">第 3 輪</option>
                <option :value="4">第 4 輪</option>
                <option :value="5">第 5 輪</option>
              </select>
            </div>
          </div>

          <!-- Presentation Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              @click="generatePptx"
              class="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Presentation class="w-4 h-4" />
              下載原版分析簡報 (.pptx)
            </button>
            <button
              type="button"
              @click="togglePreview"
              class="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-300 flex items-center gap-2"
            >
              <Eye class="w-4 h-4" />
              {{ showPreview ? '隱藏網頁簡報預覽' : '產生／更新簡報預覽' }}
            </button>
          </div>
          <p class="text-[11px] text-slate-400">
            預覽與下載 100% 採用純前端二進位合成引擎，完全共用同一份分析結果、向量圖表與格式設定。
          </p>
        </div>
      </div>

      <!-- Right: Reproducible Code Block -->
      <div class="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3">
        <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Code class="w-4 h-4 text-emerald-600" />
          可重現分析語法 (Reproducible Script)
        </h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          核心計算與 UI 介面徹底解耦；CLI、網頁預覽、Excel、HTML 與 PPTX 使用同一分析結果物件。
        </p>
        <pre class="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">{{ reproducibleScript }}</pre>
      </div>
    </div>

    <!-- Bottom: In-Browser 16:9 Presentation Preview -->
    <div v-if="showPreview" class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
      <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <Presentation class="w-5 h-5 text-indigo-600" />
            網頁內簡報逐頁預覽 (16:9 投影片)
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            目前預覽：{{ fieldLabels[pptxField] }}領域，第{{ roundLabels[pptxRound - 1] }}輪；共 {{ previewSlideCount }} 頁。
          </p>
        </div>
      </div>

      <!-- Stack of Slides -->
      <div class="space-y-8 max-w-4xl mx-auto">
        <!-- Slide 1: Cover -->
        <div class="bg-white border-2 border-slate-300 rounded-xl shadow-md aspect-video relative overflow-hidden text-center">
          <div class="absolute left-[20%] top-[18.7%] h-[25%] w-[60%] space-y-0 leading-tight">
            <h1 class="text-5xl sm:text-6xl font-extrabold text-[#1B365D] tracking-wide">
              {{ fieldLabels[pptxField] }}領域
            </h1>
            <h1 class="text-5xl sm:text-6xl font-extrabold text-[#1B365D] tracking-wide">
              標準設定會議
            </h1>
          </div>
          <div class="absolute left-[20%] top-[55.2%] h-[34%] w-[60%] space-y-2">
            <h2 class="text-2xl sm:text-3xl font-bold text-[#595959]">
              第{{ roundLabels[pptxRound - 1] }}輪專家評分結果分析報告
            </h2>
            <p class="text-sm text-slate-400 font-medium">
              會議日期：{{ todayString }}
            </p>
          </div>
        </div>

        <!-- Slide 2: Basic Consistency -->
        <div class="bg-white border-2 border-slate-300 rounded-xl shadow-md aspect-video relative overflow-hidden">
          <h2 class="absolute left-[16.25%] top-[5.3%] h-[8%] w-[67.5%] text-xl sm:text-2xl font-bold text-[#1B365D] text-center">
            基礎等級門檻分析 (Cut Score)
          </h2>
          <div class="absolute left-[16.25%] top-[17.3%] h-[60%] w-[67.5%]">
            <img v-if="chart1Image" :src="chart1Image" class="h-full w-full object-fill" />
            <div v-else class="text-xs text-slate-400">圖表生成中...</div>
          </div>
          <div class="absolute left-[16.25%] top-[78.7%] h-[17%] w-[67.5%] space-y-[1px] text-left text-[13px] leading-tight text-slate-700">
            <div class="font-bold">基礎等級通過門檻對照值 (平均數 ± 1個標準差)：</div>
            <div>• 基礎 - 1個標準差 (寬鬆門檻)：{{ analysis.legacyThresholds.基礎 - analysis.legacyThresholds.基礎標準差 }} 題</div>
            <div class="font-bold text-[#385723]">• 基礎等級 (平均門檻值)：{{ analysis.legacyThresholds.基礎 }} 題</div>
            <div>• 基礎 + 1個標準差 (嚴格門檻)：{{ analysis.legacyThresholds.基礎 + analysis.legacyThresholds.基礎標準差 }} 題</div>
          </div>
        </div>

        <!-- Slide 3: Mastery Consistency -->
        <div class="bg-white border-2 border-slate-300 rounded-xl shadow-md aspect-video relative overflow-hidden">
          <h2 class="absolute left-[16.25%] top-[5.3%] h-[8%] w-[67.5%] text-xl sm:text-2xl font-bold text-[#1B365D] text-center">
            精熟等級門檻分析 (Cut Score)
          </h2>
          <div class="absolute left-[16.25%] top-[17.3%] h-[60%] w-[67.5%]">
            <img v-if="chart2Image" :src="chart2Image" class="h-full w-full object-fill" />
            <div v-else class="text-xs text-slate-400">圖表生成中...</div>
          </div>
          <div class="absolute left-[16.25%] top-[78.7%] h-[17%] w-[67.5%] space-y-[1px] text-left text-[13px] leading-tight text-slate-700">
            <div class="font-bold">精熟等級通過門檻對照值 (平均數 ± 1個標準差)：</div>
            <div>• 精熟 - 1個標準差 (寬鬆門檻)：{{ analysis.legacyThresholds.精熟 - analysis.legacyThresholds.精熟標準差 }} 題</div>
            <div class="font-bold text-[#385723]">• 精熟等級 (平均門檻值)：{{ analysis.legacyThresholds.精熟 }} 題</div>
            <div>• 精熟 + 1個標準差 (嚴格門檻)：{{ analysis.legacyThresholds.精熟 + analysis.legacyThresholds.精熟標準差 }} 題</div>
          </div>
        </div>

        <!-- Slide 4: Item Disagreement Table Preview -->
        <div v-if="analysis && analysis.varianceSheet.length > 0" class="bg-white border-2 border-slate-300 rounded-xl shadow-md aspect-video relative overflow-hidden text-[12px] leading-none">
            <table class="absolute left-[14%] top-[2.5%] h-[95%] w-[36%] table-fixed border-collapse border border-black text-center">
              <colgroup><col style="width:20%"><col style="width:21.875%"><col style="width:18.125%"><col style="width:20%"><col style="width:20%"></colgroup>
              <thead class="bg-[#C6EFCE]">
                <tr>
                  <th class="border border-black">題號</th>
                  <th class="border border-black">變異數</th>
                  <th class="border border-black">A</th>
                  <th class="border border-black">B</th>
                  <th class="border border-black">C</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in previewLeftItems" :key="idx" :class="idx % 2 === 0 ? 'bg-[#E6E6E6]' : ''">
                  <td class="border border-black">{{ it.題號 }}</td>
                  <td class="border border-black">{{ it.標準差 }}</td>
                  <td class="border border-black">{{ it.A }}</td>
                  <td class="border border-black">{{ it.B }}</td>
                  <td class="border border-black">{{ it.C }}</td>
                </tr>
              </tbody>
            </table>
            <table class="absolute left-[50%] top-[2.5%] h-[95%] w-[36%] table-fixed border-collapse border border-black text-center">
              <colgroup><col style="width:18.54%"><col style="width:21.46%"><col style="width:20%"><col style="width:20%"><col style="width:20%"></colgroup>
              <thead class="bg-[#C6EFCE]">
                <tr>
                  <th class="border border-black">題號</th>
                  <th class="border border-black">變異數</th>
                  <th class="border border-black">A</th>
                  <th class="border border-black">B</th>
                  <th class="border border-black">C</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in previewRightItems" :key="idx" :class="idx % 2 === 0 ? 'bg-[#E6E6E6]' : ''">
                  <td class="border border-black">{{ it.題號 }}</td>
                  <td class="border border-black">{{ it.標準差 }}</td>
                  <td class="border border-black">{{ it.A }}</td>
                  <td class="border border-black">{{ it.B }}</td>
                  <td class="border border-black">{{ it.C }}</td>
                </tr>
              </tbody>
            </table>
        </div>

        <!-- Slide 5: Student Distribution (If available) -->
        <div v-if="studentResult" class="bg-white border-2 border-slate-300 rounded-xl shadow-md aspect-video relative overflow-hidden">
          <h2 class="absolute left-[12.5%] top-[5.3%] h-[8%] w-[34%] text-[22px] font-normal text-black">
            學生等級比例分布
          </h2>
          <div class="absolute left-[1.875%] top-[15.33%] h-[63.33%] w-[35.625%]">
            <img v-if="pieChartImage" :src="pieChartImage" class="h-full w-full object-fill" />
            <div v-else class="text-xs text-slate-400">圓餅圖生成中...</div>
          </div>
          <table class="absolute left-[39.1%] top-[21.9%] h-[47.4%] w-[55.8%] table-fixed border border-[#C65911] border-collapse text-center text-[17px] leading-none">
                <colgroup><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"><col style="width:20%"></colgroup>
                <thead class="bg-[#ED7D31] text-white">
                  <tr>
                    <th class="border border-white border-t-[#C65911] border-b-[#ED7D31] border-l-[#C65911] font-bold">最低能力</th>
                    <th class="border border-white border-t-[#C65911] border-b-[#ED7D31] font-bold">答對題數</th>
                    <th class="border border-white border-t-[#C65911] border-b-[#ED7D31] font-bold">全體</th>
                    <th class="border border-white border-t-[#C65911] border-b-[#ED7D31] font-bold">人數</th>
                    <th class="border border-white border-t-[#C65911] border-b-[#ED7D31] border-r-[#C65911] font-bold">百分比</th>
                  </tr>
                </thead>
                <tbody class="bg-white text-black">
                  <tr>
                    <td class="border border-[#ED7D31]"></td>
                    <td class="border border-[#ED7D31]">0-{{ Math.max(0, effectiveThresholds.基礎 - 1) }}</td>
                    <td class="border border-[#ED7D31]">待加強</td>
                    <td class="border border-[#ED7D31]">{{ previewSummary.needs.count }}</td>
                    <td class="border border-[#ED7D31]">{{ previewSummary.needs.pct }}%</td>
                  </tr>
                  <tr>
                    <td class="border border-[#ED7D31] text-[#7030A0]">基礎</td>
                    <td class="border border-[#ED7D31]">{{ effectiveThresholds.基礎 }}-{{ Math.max(effectiveThresholds.基礎, effectiveThresholds.精熟 - 1) }}</td>
                    <td class="border border-[#ED7D31]">基礎</td>
                    <td class="border border-[#ED7D31]">{{ previewSummary.basic.count }}</td>
                    <td class="border border-[#ED7D31]">{{ previewSummary.basic.pct }}%</td>
                  </tr>
                  <tr>
                    <td class="border border-[#ED7D31] text-[#7030A0]">精熟</td>
                    <td class="border border-[#ED7D31]">{{ effectiveThresholds.精熟 }}-{{ analysis.nItems }}</td>
                    <td class="border border-[#ED7D31]">精熟</td>
                    <td class="border border-[#ED7D31]">{{ previewSummary.mastery.count }}</td>
                    <td class="border border-[#ED7D31]">{{ previewSummary.mastery.pct }}%</td>
                  </tr>
                  <tr class="font-bold">
                    <td class="border border-[#ED7D31]"></td>
                    <td class="border border-[#ED7D31]"></td>
                    <td class="border border-[#ED7D31]">合計</td>
                    <td class="border border-[#ED7D31]">{{ studentResult.totalValid }}</td>
                    <td class="border border-[#ED7D31]">100%</td>
                  </tr>
                </tbody>
          </table>
          <div class="absolute left-[47.22%] top-[37.55%] flex h-[6.73%] w-[4.75%] items-center justify-center border border-black bg-white text-2xl font-bold">
            {{ effectiveThresholds.基礎 }}
          </div>
          <div class="absolute left-[47.22%] top-[46.96%] flex h-[6.73%] w-[4.75%] items-center justify-center border border-black bg-white text-2xl font-bold">
            {{ effectiveThresholds.精熟 }}
          </div>
          <div class="absolute bottom-[2.2%] right-[7%] text-sm text-[#A6A6A6]">{{ previewSlideCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  AlertCircle, 
  DownloadCloud, 
  FileSpreadsheet, 
  FileCode, 
  Presentation, 
  Eye, 
  Code 
} from 'lucide-vue-next';
import { saveAs } from 'file-saver';
import { FIELD_LABELS, ROUND_LABELS, VARIANCE_ITEMS_PER_SLIDE } from '../../core/constants.js';
import { SAAAMath } from '../../core/math.js';
import { generateExcelWorkbook } from '../../core/excelGenerator.js';
import { generateHtmlReport } from '../../core/htmlReportGenerator.js';
import { generatePptxReport } from '../../core/pptxGenerator.js';
import { buildConsistencyChartOption, buildPieChartOption, renderChartToBase64 } from '../../core/chartRenderer.js';

const props = defineProps({
  analysis: { type: Object, default: null },
  studentResult: { type: Object, default: null },
  expertFileName: { type: String, default: null },
  studentFileName: { type: String, default: null },
  currentSimulatedBase: { type: Number, default: null },
  currentSimulatedMastery: { type: Number, default: null },
  getChart1Base64: { type: Function, default: null },
  getChart2Base64: { type: Function, default: null },
  getPieChartBase64: { type: Function, default: null }
});

const pptxField = ref('S');
const pptxRound = ref(1);
const showPreview = ref(false);

const fieldLabels = FIELD_LABELS;
const roundLabels = ROUND_LABELS;

const todayString = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
});

const effectiveThresholds = computed(() => {
  if (!props.analysis) return { 基礎: 0, 精熟: 0 };
  return {
    基礎: props.currentSimulatedBase !== null ? props.currentSimulatedBase : props.analysis.thresholds.current.基礎,
    精熟: props.currentSimulatedMastery !== null ? props.currentSimulatedMastery : props.analysis.thresholds.current.精熟
  };
});

const chart1Image = ref(null);
const chart2Image = ref(null);
const pieChartImage = ref(null);

const togglePreview = () => {
  showPreview.value = !showPreview.value;
  if (showPreview.value && props.analysis) {
    const legacy = props.analysis.legacyThresholds;
    const expertScores1 = props.analysis.expertStats ? props.analysis.expertStats.map(e => e.基礎切截分數) : [];
    const expertScores2 = props.analysis.expertStats ? props.analysis.expertStats.map(e => e.精熟切截分數) : [];

    chart1Image.value = renderChartToBase64(buildConsistencyChartOption('基礎', expertScores1, legacy.基礎, legacy.基礎標準差));
    chart2Image.value = renderChartToBase64(buildConsistencyChartOption('精熟', expertScores2, legacy.精熟, legacy.精熟標準差));
    if (props.studentResult) {
      pieChartImage.value = renderChartToBase64(buildPieChartOption(props.studentResult.summary), 1000, 1000);
    }
  }
};

const previewSlideCount = computed(() => {
  if (!props.analysis) return 0;
  const totalItems = props.analysis.varianceSheet.length;
  const numItemSlides = Math.ceil(totalItems / VARIANCE_ITEMS_PER_SLIDE);
  return 3 + numItemSlides + (props.studentResult ? 1 : 0);
});

const previewLeftItems = computed(() => {
  if (!props.analysis) return [];
  const sub = props.analysis.varianceSheet.slice(0, VARIANCE_ITEMS_PER_SLIDE);
  const mid = Math.ceil(sub.length / 2);
  return sub.slice(0, mid);
});

const previewRightItems = computed(() => {
  if (!props.analysis) return [];
  const sub = props.analysis.varianceSheet.slice(0, VARIANCE_ITEMS_PER_SLIDE);
  const mid = Math.ceil(sub.length / 2);
  return sub.slice(mid);
});

const previewSummary = computed(() => {
  if (!props.studentResult) return { needs: { count: 0, pct: 0 }, basic: { count: 0, pct: 0 }, mastery: { count: 0, pct: 0 } };
  const s = props.studentResult.summary;
  const n = s.find(it => it.等級 === '待加強') || { 人數: 0, 百分比: 0 };
  const b = s.find(it => it.等級 === '基礎') || { 人數: 0, 百分比: 0 };
  const m = s.find(it => it.等級 === '精熟') || { 人數: 0, 百分比: 0 };
  return {
    needs: { count: n.人數, pct: SAAAMath.roundToEven(n.百分比 * 100) },
    basic: { count: b.人數, pct: SAAAMath.roundToEven(b.百分比 * 100) },
    mastery: { count: m.人數, pct: SAAAMath.roundToEven(m.百分比 * 100) }
  };
});

const exportExcel = async () => {
  if (!props.analysis) return;
  const clonedAnalysis = JSON.parse(JSON.stringify(props.analysis));
  clonedAnalysis.thresholds.current = effectiveThresholds.value;

  const buffer = await generateExcelWorkbook({
    analysis: clonedAnalysis,
    studentResult: props.studentResult,
    audit: {
      expertName: props.expertFileName,
      studentName: props.studentFileName
    }
  });

  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const d = new Date();
  const dateNum = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  saveAs(blob, `Angoff_Studio_${dateNum}.xlsx`);
};

const exportHtml = () => {
  if (!props.analysis) return;
  const clonedAnalysis = JSON.parse(JSON.stringify(props.analysis));
  clonedAnalysis.thresholds.current = effectiveThresholds.value;

  const html = generateHtmlReport({
    analysis: clonedAnalysis,
    studentResult: props.studentResult
  });

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const d = new Date();
  const dateNum = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  saveAs(blob, `Angoff_Studio_${dateNum}.html`);
};

const generatePptx = async () => {
  if (!props.analysis) return;

  const legacy = props.analysis.legacyThresholds;
  const expertScores1 = props.analysis.expertStats ? props.analysis.expertStats.map(e => e.基礎切截分數) : [];
  const expertScores2 = props.analysis.expertStats ? props.analysis.expertStats.map(e => e.精熟切截分數) : [];

  // Directly generate guaranteed fresh, 1600x900 offscreen charts in memory
  const c1 = renderChartToBase64(buildConsistencyChartOption('基礎', expertScores1, legacy.基礎, legacy.基礎標準差));
  const c2 = renderChartToBase64(buildConsistencyChartOption('精熟', expertScores2, legacy.精熟, legacy.精熟標準差));
  const pie = props.studentResult ? renderChartToBase64(buildPieChartOption(props.studentResult.summary), 1000, 1000) : null;

  const clonedAnalysis = JSON.parse(JSON.stringify(props.analysis));
  clonedAnalysis.thresholds.current = effectiveThresholds.value;

  const pres = await generatePptxReport({
    fieldName: fieldLabels[pptxField.value],
    roundCn: roundLabels[pptxRound.value - 1],
    analysis: clonedAnalysis,
    studentResult: props.studentResult,
    chart1Base64: c1,
    chart2Base64: c2,
    pieChartBase64: pie
  });

  await pres.writeFile({ fileName: `第${roundLabels[pptxRound.value - 1]}輪結果.pptx` });
};

const reproducibleScript = computed(() => {
  if (!props.analysis) return '';
  return `// SAAA Angoff Studio 可重現分析
import { calculateAngoff } from './core/analysis.js';
import { classifyStudents } from './core/simulation.js';

const analysis = calculateAngoff(
  expertData,
  headers,
  "${props.analysis.missingPolicy}",
  "${props.analysis.roundingMethod}",
  ${props.analysis.nItems}
);

const students = classifyStudents(
  studentData,
  "分數",
  ${effectiveThresholds.value.基礎}, // 基礎門檻
  ${effectiveThresholds.value.精熟}, // 精熟門檻
  ${props.analysis.nItems}
);`;
});
</script>
