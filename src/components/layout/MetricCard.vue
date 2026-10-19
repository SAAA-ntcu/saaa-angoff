<template>
  <div 
    class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow"
    :style="{ borderTop: `4px solid ${accentColor}` }"
  >
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
      {{ label }}
    </div>
    <div class="text-3xl font-extrabold text-slate-800 tracking-tight">
      {{ value }}
    </div>
    <div v-if="note" class="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
      <span class="inline-block w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: accentColor }"></span>
      {{ note }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  note: { type: String, default: null },
  accentColor: { type: String, default: '#1D4E89' }
});
</script>
