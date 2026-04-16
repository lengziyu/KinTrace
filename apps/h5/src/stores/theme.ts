import { defineStore } from "pinia";
import { STORAGE_KEYS } from "@kintrace/shared";

type ThemeMode = "light" | "dark" | "system";
type ActualTheme = "light" | "dark";

function resolveSystemTheme(): ActualTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = defineStore("h5-theme", {
  state: () => ({
    theme: (localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode | null) ?? "dark",
    actualTheme: "dark" as ActualTheme,
  }),
  actions: {
    applyTheme() {
      const root = document.documentElement;
      const actualTheme = this.theme === "system" ? resolveSystemTheme() : this.theme;

      this.actualTheme = actualTheme;
      root.classList.toggle("dark", actualTheme === "dark");
      root.dataset.theme = actualTheme;
      root.style.colorScheme = actualTheme;
    },
    setTheme(theme: ThemeMode) {
      this.theme = theme;
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      this.applyTheme();
    },
    toggleTheme() {
      const nextTheme: ActualTheme = this.actualTheme === "dark" ? "light" : "dark";
      this.setTheme(nextTheme);
    },
  },
});
