<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            AS
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-extrabold text-slate-800 text-lg tracking-tight">Angoff Studio</span>
              <span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">純前端版</span>
            </div>
            <p class="text-xs text-slate-500 hidden sm:block">SAAA 標準設定工作台 · 100% 本地運算</p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="flex items-center space-x-1 sm:space-x-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="$emit('update:activeTab', tab.id)"
            :class="[
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { 
  Database, 
  Users, 
  ListOrdered, 
  SlidersHorizontal, 
  FileDown 
} from 'lucide-vue-next';

defineProps({
  activeTab: { type: String, default: 'data' }
});

defineEmits(['update:activeTab']);

const tabs = [
  { id: 'data', label: '資料', icon: Database },
  { id: 'experts', label: '專家一致性', icon: Users },
  { id: 'items', label: '題目分析', icon: ListOrdered },
  { id: 'simulation', label: '門檻模擬', icon: SlidersHorizontal },
  { id: 'reports', label: '報告', icon: FileDown }
];
</script>
