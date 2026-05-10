<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  modelValue?: string | number;
  placeholder?: string;
  type?: string;
  class?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <input
    :value="modelValue"
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :class="
      cn(
        'flex h-11 w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.58)] px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus-visible:border-[hsl(var(--ring))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))/0.25]',
        $props.class,
      )
    "
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
