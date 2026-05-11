import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("@/pages/HomePage.vue"), meta: { title: "首页" } },
    { path: "/about", component: () => import("@/pages/AboutPage.vue"), meta: { title: "关于" } },
    { path: "/join", component: () => import("@/pages/JoinPage.vue"), meta: { title: "加入家族" } },
    { path: "/login", redirect: (to) => ({ path: "/join", query: to.query }) },
    { path: "/map", component: () => import("@/pages/MapPage.vue"), meta: { title: "墓点地图" } },
    { path: "/genealogy", component: () => import("@/pages/GenealogyPage.vue"), meta: { title: "族谱树" } },
    { path: "/tombs/:id", component: () => import("@/pages/TombDetailPage.vue"), meta: { title: "墓点详情" } },
    { path: "/routes", component: () => import("@/pages/RoutesPage.vue"), meta: { title: "线路规划" } },
    { path: "/me/settings", component: () => import("@/pages/MeSettingsPage.vue"), meta: { title: "账号设置" } },
    { path: "/me", component: () => import("@/pages/MePage.vue"), meta: { title: "我的" } },
  ],
});
