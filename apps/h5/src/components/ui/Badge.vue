<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "outline";

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
  }>(),
  {
    variant: "default",
  },
);

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[rgba(36,131,255,0.14)] text-[#3b82f6] dark:text-[#93c5fd]",
  success: "bg-[rgba(16,185,129,0.14)] text-emerald-600 dark:text-emerald-400",
  warning: "bg-[rgba(245,158,11,0.14)] text-amber-600 dark:text-amber-400",
  outline: "border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.55)] text-muted-foreground",
};

const classes = computed(() =>
  cn(
    "inline-flex shrink-0 items-center whitespace-nowrap rounded-[var(--radius-md)] px-2.5 py-1 text-xs font-medium leading-none",
    variantClasses[props.variant],
  ),
);
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
