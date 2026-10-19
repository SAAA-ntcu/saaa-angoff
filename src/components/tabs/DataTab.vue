<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Left Column: Controls & Settings -->
    <div class="lg:col-span-4 space-y-6">
      <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        <h3 class="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UploadCloud class="w-5 h-5 text-blue-600" />
          1. 匯入資料
        </h3>

        <!-- Expert file upload -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            專家評分資料 <span class="text-rose-500">*</span>
          </label>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            @change="handleExpertFileUpload"
            class="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1"
          />
          <div v-if="expertFileName" class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <FileSpreadsheet class="w-3.5 h-3.5 text-blue-500" />
            已載入：{{ expertFileName }}
          </div>
        </div>

        <!-- Student file upload -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            學生分數資料（選填）
          </label>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            @change="handleStudentFileUpload"
            class="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-lg p-1"
          />
          <div v-if="studentFileName" class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-500" />
            已載入：{{ studentFileName }}
          </div>
        </div>

        <!-- Load Sample Data -->
        <button
          type="button"
          @click="loadSample"
          class="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-xs flex items-center justify-center gap-2"
        >
          <Sparkles class="w-4 h-4" />
          載入內建範例資料 (8位專家 / 13題 / 30位學生)
        </button>

        <div class="border-t border-slate-100 pt-4 space-y-4">
          <h4 class="text-sm font-bold text-slate-800">分析設定</h4>

          <!-- Missing policy -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">缺答處理</label>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <label :class="['flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all', missingPolicy === 'error' ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-semibold' : 'border-slate-200 hover:bg-slate-50']">
                <input type="radio" value="error" v-model="missingPolicy" class="text-blue-600 focus:ring-blue-500" />
                <span>阻止分析</span>
              </label>
              <label :class="['flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all', missingPolicy === 'exclude' ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-semibold' : 'border-slate-200 hover:bg-slate-50']">
                <input type="radio" value="exclude" v-model="missingPolicy" class="text-blue-600 focus:ring-blue-500" />
                <span>排除缺值</span>
              </label>
            </div>
          </div>

          <!-- Rounding Method -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">切截分數取整</label>
            <select
              v-model="roundingMethod"
              class="w-full text-xs rounded-lg border-slate-200 p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="half_up">傳統四捨五入（half-up，如 9.5 → 10）</option>
              <option value="ceiling">無條件進位（ceiling）</option>
              <option value="floor">無條件捨去（floor）</option>
              <option value="bankers">R 預設 ties-to-even（奇進偶捨）</option>
            </select>
          </div>

          <!-- Item count control -->
          <div v-if="detectedItemCount > 0">
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs font-semibold text-slate-700">分析題數</label>
              <span class="text-xs font-bold text-blue-600">{{ itemCount }} / {{ detectedItemCount }} 題</span>
            </div>
            <input
              type="range"
              :min="1"
              :max="detectedItemCount"
              v-model.number="itemCount"
              class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <!-- Student score column -->
          <div v-if="studentData && studentData.length > 0">
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">學生分數欄位</label>
            <select
              v-model="scoreCol"
              class="w-full text-xs rounded-lg border-slate-200 p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="">-- 請選擇學生分數欄位 --</option>
              <option v-for="col in studentHeaders" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Status & Previews -->
    <div class="lg:col-span-8 space-y-6">
      <!-- Card: Data Quality -->
      <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 class="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck class="w-5 h-5 text-emerald-600" />
          2. 資料品質檢核
        </h3>

        <!-- Expert status -->
        <StatusBlock
          v-if="!expertData"
          title="尚未載入專家資料"
          :messages="['請於左側上傳專家評分檔案，或點擊「載入內建範例資料」。']"
          type="info"
        />
        <StatusBlock
          v-else-if="!expertValidation.valid"
          title="專家資料已讀取，但尚未通過分析驗證"
          :messages="expertValidation.errors"
          type="danger"
        />
        <StatusBlock
          v-else
          title="專家資料可進行分析"
          :messages="expertValidMessages"
          :type="expertValidation.warnings.length > 0 ? 'warning' : 'success'"
        />

        <!-- Student status -->
        <StatusBlock
          v-if="!studentData"
          title="尚未載入學生資料；仍可進行專家分析"
          :messages="['若需進行門檻模擬與等級比例衝擊評估，請於左側匯入學生分數檔案。']"
          type="info"
        />
        <StatusBlock
          v-else-if="!scoreCol"
          title="請於左側選擇學生分數欄位"
          :messages="['已讀取學生檔案，請指定用以分類之得分欄。']"
          type="warning"
        />
        <StatusBlock
          v-else-if="!studentValidation.valid"
          title="學生資料尚未通過驗證"
          :messages="studentValidation.errors"
          type="danger"
        />
        <StatusBlock
          v-else
          title="學生資料可進行等級劃分"
          :messages="studentValidMessages"
          :type="studentValidation.warnings.length > 0 ? 'warning' : 'success'"
        />
      </div>

      <!-- Card: Data Preview -->
      <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <Table class="w-5 h-5 text-indigo-600" />
            資料即時預覽 (前 15 列)
          </h3>
          <div class="flex gap-2">
            <button
              @click="previewTab = 'experts'"
              :class="['px-3 py-1 text-xs font-semibold rounded-lg transition-all', previewTab === 'experts' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
            >
              專家評分 ({{ expertData ? expertData.length : 0 }})
            </button>
            <button
              @click="previewTab = 'students'"
              :class="['px-3 py-1 text-xs font-semibold rounded-lg transition-all', previewTab === 'students' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
            >
              學生分數 ({{ studentData ? studentData.length : 0 }})
            </button>
          </div>
        </div>

        <div v-if="previewTab === 'experts'">
          <div v-if="!expertData || expertData.length === 0" class="text-center py-10 text-slate-400 text-xs">
            尚未載入專家評分資料
          </div>
          <div v-else class="overflow-x-auto max-h-96 text-xs">
            <table class="min-w-full divide-y divide-slate-200 border border-slate-200">
              <thead class="bg-slate-50 sticky top-0">
                <tr>
                  <th v-for="col in previewExpertHeaders" :key="col" class="px-3 py-2 text-center font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="(row, rIdx) in previewExpertRows" :key="rIdx" class="hover:bg-slate-50">
                  <td v-for="col in previewExpertHeaders" :key="col" class="px-3 py-1.5 text-center whitespace-nowrap text-slate-700">
                    {{ row[col] !== undefined ? row[col] : '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else>
          <div v-if="!studentData || studentData.length === 0" class="text-center py-10 text-slate-400 text-xs">
            尚未載入學生分數資料
          </div>
          <div v-else class="overflow-x-auto max-h-96 text-xs">
            <table class="min-w-full divide-y divide-slate-200 border border-slate-200">
              <thead class="bg-slate-50 sticky top-0">
                <tr>
                  <th v-for="col in studentHeaders" :key="col" class="px-3 py-2 text-center font-bold text-slate-700 whitespace-nowrap border-b border-slate-200">
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="(row, rIdx) in previewStudentRows" :key="rIdx" class="hover:bg-slate-50">
                  <td v-for="col in studentHeaders" :key="col" class="px-3 py-1.5 text-center whitespace-nowrap text-slate-700">
                    {{ row[col] !== undefined ? row[col] : '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  Table, 
  FileSpreadsheet 
} from 'lucide-vue-next';
import StatusBlock from '../layout/StatusBlock.vue';

const props = defineProps({
  expertData: { type: Array, default: null },
  expertHeaders: { type: Array, default: () => [] },
  expertFileName: { type: String, default: null },
  studentData: { type: Array, default: null },
  studentHeaders: { type: Array, default: () => [] },
  studentFileName: { type: String, default: null },
  expertValidation: { type: Object, default: () => ({ valid: false, errors: [], warnings: [] }) },
  studentValidation: { type: Object, default: () => ({ valid: false, errors: [], warnings: [] }) },
  missingPolicy: { type: String, default: 'error' },
  roundingMethod: { type: String, default: 'half_up' },
  itemCount: { type: Number, default: 0 },
  detectedItemCount: { type: Number, default: 0 },
  scoreCol: { type: String, default: '' }
});

const emit = defineEmits([
  'update:missingPolicy',
  'update:roundingMethod',
  'update:itemCount',
  'update:scoreCol',
  'load-sample',
  'upload-expert',
  'upload-student'
]);

const previewTab = ref('experts');

const missingPolicy = computed({
  get: () => props.missingPolicy,
  set: (val) => emit('update:missingPolicy', val)
});

const roundingMethod = computed({
  get: () => props.roundingMethod,
  set: (val) => emit('update:roundingMethod', val)
});

const itemCount = computed({
  get: () => props.itemCount,
  set: (val) => emit('update:itemCount', val)
});

const scoreCol = computed({
  get: () => props.scoreCol,
  set: (val) => emit('update:scoreCol', val)
});

const handleExpertFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) emit('upload-expert', file);
};

const handleStudentFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) emit('upload-student', file);
};

const loadSample = () => {
  emit('load-sample');
};

const expertValidMessages = computed(() => {
  if (!props.expertValidation.valid) return [];
  const v = props.expertValidation;
  return [
    `有效專家：${v.numExperts} 位`,
    `分析題數：${v.numItems} 題`,
    ...v.warnings
  ];
});

const studentValidMessages = computed(() => {
  if (!props.studentValidation.valid) return [];
  const v = props.studentValidation;
  return [
    `有效資料列：${v.validScores.length} 筆`,
    `使用分數欄：${props.scoreCol}`,
    ...v.warnings
  ];
});

const previewExpertHeaders = computed(() => {
  return props.expertHeaders.slice(0, 15);
});

const previewExpertRows = computed(() => {
  if (!props.expertData) return [];
  return props.expertData.slice(0, 15);
});

const previewStudentRows = computed(() => {
  if (!props.studentData) return [];
  return props.studentData.slice(0, 15);
});
</script>
