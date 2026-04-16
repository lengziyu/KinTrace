<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

const props = withDefaults(
  defineProps<{
    as?: "button" | "a";
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: ButtonSize;
  }>(),
  {
    as: "button",
    type: "button",
    variant: "default",
    size: "default",
  },
);

const attrs = useAttrs();

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[linear-gradient(180deg,#2584ff,#1667d6)] text-primary-foreground shadow-[0_10px_24px_rgba(22,103,214,0.24)] hover:brightness-110",
  secondary:
    "bg-[hsl(var(--secondary))] text-secondary-foreground hover:brightness-[1.03]",
  outline:
    "border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.55)] text-foreground hover:bg-[hsl(var(--muted))]",
  ghost:
    "text-muted-foreground hover:bg-[hsl(var(--muted)/0.7)] hover:text-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-5",
};

const classes = computed(() =>
  cn(
    "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    variantClasses[props.variant],
    sizeClasses[props.size],
  ),
);
</script>

<template>
  <component :is="props.as" v-bind="attrs" :class="classes" :type="props.as === 'button' ? props.type : undefined">
    <slot />
  </component>
</template>
