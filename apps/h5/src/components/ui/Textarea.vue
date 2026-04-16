<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  modelValue?: string;
  placeholder?: string;
  rows?: number;
  class?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <textarea
    :value="modelValue"
    :rows="rows ?? 4"
    :placeholder="placeholder"
    :class="cn('flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring', $props.class)"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

