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
    "border border-white/10 bg-[linear-gradient(135deg,rgba(68,153,255,1),rgba(29,78,216,1))] text-primary-foreground shadow-[0_14px_28px_rgba(22,103,214,0.26)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
  secondary:
    "border border-white/10 bg-[linear-gradient(135deg,rgba(37,132,255,0.16),rgba(30,200,192,0.16))] text-foreground shadow-[0_10px_24px_rgba(37,132,255,0.08)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0",
  outline:
    "border border-[hsl(var(--border))] bg-[linear-gradient(135deg,hsl(var(--card)/0.88),hsl(var(--card)/0.62))] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 hover:border-[hsl(var(--ring))/0.34] hover:bg-[linear-gradient(135deg,hsl(var(--card)/0.96),hsl(var(--muted)/0.92))] active:translate-y-0",
  ghost:
    "text-muted-foreground hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,hsl(var(--muted)/0.88),hsl(var(--muted)/0.62))] hover:text-foreground active:translate-y-0",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-5",
};

const classes = computed(() =>
  cn(
    "inline-flex items-center justify-center rounded-[var(--radius)] text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
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
