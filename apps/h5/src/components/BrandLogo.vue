<script setup lang="ts">
import { APP_NAME } from "@kintrace/shared";
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    compact?: boolean;
    class?: string;
    markClass?: string;
    textClass?: string;
  }>(),
  {
    compact: false,
    class: "",
    markClass: "",
    textClass: "",
  },
);

const markSize = computed(() => (props.compact ? 42 : 58));
</script>

<template>
  <div :class="cn('inline-flex items-center gap-3', props.class)">
    <svg
      :width="markSize"
      :height="markSize"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      :class="cn('shrink-0 drop-shadow-[0_10px_24px_rgba(71,56,34,0.14)]', props.markClass)"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="60" height="60" rx="20" fill="url(#kintrace-h5-bg)" />
      <path d="M12 43C18.5 36.5 24.5 33.5 32 33.5C39.5 33.5 45.5 36.5 52 43" stroke="#F6EFE4" stroke-width="2.5" stroke-linecap="round" />
      <path d="M18 42C22.8 29.8 27.5 22.5 32 20C36.5 22.5 41.2 29.8 46 42" stroke="#EBD9BF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M25 20.5H39" stroke="#F5EBDD" stroke-width="2" stroke-linecap="round" />
      <path d="M28 15.5H36" stroke="#F5EBDD" stroke-width="2" stroke-linecap="round" />
      <circle cx="32" cy="14" r="2.4" fill="#F5EBDD" />
      <path d="M23 47H41" stroke="#9CB0A0" stroke-width="2.5" stroke-linecap="round" />
      <path d="M20 51H44" stroke="#9CB0A0" stroke-width="2.5" stroke-linecap="round" opacity="0.72" />
      <defs>
        <linearGradient id="kintrace-h5-bg" x1="8" y1="8" x2="55" y2="58" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6B5840" />
          <stop offset="1" stop-color="#9A886D" />
        </linearGradient>
      </defs>
    </svg>

    <div v-if="!compact" :class="cn('min-w-0', props.textClass)">
      <p class="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{{ APP_NAME.en }}</p>
      <div class="mt-1 flex items-end gap-2">
        <h1 class="text-2xl font-semibold tracking-[0.08em] text-foreground">{{ APP_NAME.zh }}</h1>
        <span class="pb-1 text-xs text-muted-foreground">Family Memorial Map</span>
      </div>
    </div>
  </div>
</template>
