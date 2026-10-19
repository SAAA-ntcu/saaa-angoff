<template>
  <div :class="['rounded-xl p-4 border text-sm', colorClasses]">
    <div class="flex items-start gap-2.5">
      <component :is="iconComponent" class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div class="flex-1">
        <div class="font-bold tracking-wide">{{ title }}</div>
        <ul v-if="messages && messages.length > 0" class="mt-1.5 space-y-1 list-disc list-inside text-xs opacity-90">
          <li v-for="(msg, idx) in messages" :key="idx">{{ msg }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info 
} from 'lucide-vue-next';

const props = defineProps({
  title: { type: String, required: true },
  messages: { type: Array, default: () => [] },
  type: { 
    type: String, 
    default: 'info',
    validator: v => ['success', 'warning', 'danger', 'info'].includes(v)
  }
});

const colorClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-900';
    case 'danger':
      return 'bg-rose-50 border-rose-200 text-rose-900';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200 text-blue-900';
  }
});

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircle2;
    case 'warning':
      return AlertTriangle;
    case 'danger':
      return AlertCircle;
    case 'info':
    default:
      return Info;
  }
});
</script>
