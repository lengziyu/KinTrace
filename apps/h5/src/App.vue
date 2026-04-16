<script setup lang="ts">
import { APP_NAME } from "@kintrace/shared";
import { computed, onMounted } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { Bell, Compass, Home, MapPinned, UserRound } from "lucide-vue-next";
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
  { to: "/tasks", label: "祭扫", icon: Compass },
  { to: "/messages", label: "留言", icon: Bell },
  { to: "/me", label: "我的", icon: UserRound },
];

const title = computed(() => route.meta.title ?? APP_NAME.zh);

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
          <RouterLink to="/about" class="flex items-center gap-3">
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
        <RouterView v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </RouterView>
      </main>

      <nav class="h5-shell-nav fixed bottom-0 left-0 right-0 z-20 mx-auto flex w-full max-w-md border-t px-1 py-1 backdrop-blur">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-all duration-300"
          :class="
            route.path === item.to
              ? 'text-sky-500 dark:text-sky-400 scale-110'
              : 'text-muted-foreground hover:text-foreground hover:scale-105'
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
  transform: translateY(10px) scale(0.98);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
