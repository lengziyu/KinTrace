<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    duration?: number;
    suffix?: string;
  }>(),
  {
    duration: 900,
    suffix: "",
  },
);

const displayValue = ref(0);
let frameId = 0;

function cancelAnimation() {
  if (frameId) {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
}

function animateTo(nextValue: number) {
  cancelAnimation();

  const startValue = displayValue.value;
  const delta = nextValue - startValue;
  const startTime = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / props.duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    displayValue.value = Math.round(startValue + delta * eased);

    if (progress < 1) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    displayValue.value = nextValue;
    frameId = 0;
  };

  frameId = requestAnimationFrame(tick);
}

watch(
  () => props.value,
  (nextValue) => {
    animateTo(nextValue);
  },
);

onMounted(() => {
  animateTo(props.value);
});

onBeforeUnmount(() => {
  cancelAnimation();
});

const text = computed(() => `${displayValue.value}${props.suffix}`);
</script>

<template>
  <span>{{ text }}</span>
</template>
