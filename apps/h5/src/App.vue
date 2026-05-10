<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { Home, MapPinned, Route, UserRound } from "lucide-vue-next";
import BrandLogo from "./components/BrandLogo.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import { useSessionStore } from "./stores/session";
import { useThemeStore } from "./stores/theme";

const route = useRoute();
const themeStore = useThemeStore();
const sessionStore = useSessionStore();

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/map", label: "地图", icon: MapPinned },
  { to: "/routes", label: "线路", icon: Route },
  { to: "/me", label: "我的", icon: UserRound },
];

const pageTitle = computed(() => String(route.meta.title ?? "首页"));
const familyTitle = computed(() => sessionStore.family?.name?.trim() || "陈氏宗亲");
const title = computed(() => `${familyTitle.value} · ${pageTitle.value}`);

watch(
  () => title.value,
  (nextTitle) => {
    document.title = nextTitle;
  },
  { immediate: true },
);

onMounted(() => {
  themeStore.applyTheme();
  void sessionStore.bootstrap();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="mx-auto h5-shell flex min-h-screen max-w-md flex-col">
      <header class="h5-shell-header sticky top-0 z-20 border-b backdrop-blur">
        <div class="flex items-center justify-between px-4 py-3">
          <RouterLink to="/about" class="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.01]">
            <BrandLogo compact />
            <div>
              <p class="h5-kicker">KinTrace</p>
              <h1 class="text-base font-semibold text-foreground">{{ title }}</h1>
            </div>
          </RouterLink>
          <ThemeToggle />
        </div>
      </header>

      <main class="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <RouterView v-slot="{ Component, route: currentRoute }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="currentRoute.path" />
          </transition>
        </RouterView>
      </main>

      <nav class="h5-shell-nav fixed bottom-0 left-0 right-0 z-20 mx-auto flex w-full max-w-md border-t px-1 py-1 backdrop-blur">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center gap-1 rounded-[var(--radius)] py-3 text-[11px] transition-all duration-300"
          :class="
            route.path === item.to
              ? 'bg-sky-500/8 text-sky-500 dark:text-sky-400 scale-[1.03]'
              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:scale-[1.01]'
          "
        >
          <component :is="item.icon" class="size-4" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.985);
}
</style>
