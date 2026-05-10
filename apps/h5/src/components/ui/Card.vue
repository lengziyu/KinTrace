<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  class?: string;
}>();
</script>

<template>
  <section
    :class="
      cn(
        'h5-surface rounded-[var(--radius)] border p-4',
        $props.class,
      )
    "
  >
    <slot />
  </section>
</template>
