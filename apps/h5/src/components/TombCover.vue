<script setup lang="ts">
import type { TombPoint } from "@kintrace/shared";
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { getTombCoverUrl } from "@/lib/tomb-cover";

const props = withDefaults(
  defineProps<{
    tomb: Pick<TombPoint, "id" | "name" | "titleName" | "branchName" | "generation" | "coverImage">;
    class?: string;
    imgClass?: string;
  }>(),
  {
    class: "",
    imgClass: "",
  },
);

const src = computed(() => getTombCoverUrl(props.tomb));
</script>

<template>
  <div :class="cn('overflow-hidden rounded-2xl border border-border/70 bg-muted/40', props.class)">
    <img :src="src" :alt="props.tomb.name" :class="cn('h-full w-full object-cover', props.imgClass)" />
  </div>
</template>

