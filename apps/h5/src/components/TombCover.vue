<script setup lang="ts">
import type { TombPoint } from "@kintrace/shared";
import { computed } from "vue";
import { cn } from "@/lib/utils";
import {
  getTombCoverImageUrl,
  getTombCoverPalette,
  getTombCoverSubtitle,
  getTombCoverTitle,
} from "@/lib/tomb-cover";

const props = withDefaults(
  defineProps<{
    tomb: Pick<TombPoint, "id" | "name" | "titleName" | "branchName" | "generation" | "areaName" | "coverImage">;
    class?: string;
    imgClass?: string;
  }>(),
  {
    class: "",
    imgClass: "",
  },
);

const imageUrl = computed(() => getTombCoverImageUrl(props.tomb));
const palette = computed(() => getTombCoverPalette(props.tomb));
const title = computed(() => getTombCoverTitle(props.tomb));
const subtitle = computed(() => getTombCoverSubtitle(props.tomb));
const backgroundStyle = computed(() => ({
  backgroundImage: `
    radial-gradient(circle at 78% 14%, ${palette.value.glow}, transparent 22%),
    linear-gradient(140deg, ${palette.value.start} 0%, ${palette.value.end} 100%)
  `,
}));
const waveStyle = computed(() => ({
  backgroundImage: `
    linear-gradient(180deg, transparent 0%, rgba(17, 24, 39, 0.06) 100%),
    linear-gradient(120deg, ${palette.value.wave} 0%, ${palette.value.start} 100%)
  `,
}));
</script>

<template>
  <div :class="cn('overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-muted/40', props.class)">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="props.tomb.name"
      :class="cn('h-full w-full object-cover', props.imgClass)"
    />
    <div
      v-else
      class="relative flex h-full w-full flex-col overflow-hidden px-4 py-3 text-white"
      :style="backgroundStyle"
    >
      <div class="pointer-events-none absolute inset-x-4 top-4 h-[1px]" :style="{ backgroundColor: palette.line }" />
      <div
        class="pointer-events-none absolute bottom-0 left-0 right-0 h-[46%] opacity-80"
        :style="waveStyle"
      />
      <div
        class="pointer-events-none absolute bottom-0 left-0 right-0 h-[32%] opacity-40"
        :style="{ background: `linear-gradient(90deg, ${palette.start} 0%, transparent 100%)` }"
      />

      <div class="relative z-10 flex h-full flex-col justify-between">
        <p class="text-[10px] uppercase tracking-[0.34em] text-white/72">KINTRACE</p>
        <div>
          <p class="line-clamp-2 text-lg font-semibold leading-tight text-white">{{ title }}</p>
          <p class="mt-2 text-xs leading-5 text-white/82">{{ subtitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
