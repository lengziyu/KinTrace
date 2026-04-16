<script setup lang="ts">
import { computed } from "vue";
import { MoonStar, SunMedium } from "lucide-vue-next";
import Button from "./ui/Button.vue";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();

const icon = computed(() => (themeStore.actualTheme === "dark" ? MoonStar : SunMedium));
const label = computed(() => (themeStore.actualTheme === "dark" ? "切换到浅色主题" : "切换到深色主题"));
</script>

<template>
  <Button variant="ghost" size="sm" :aria-label="label" :title="label" @click="themeStore.toggleTheme()">
    <component :is="icon" class="size-4" />
  </Button>
</template>
