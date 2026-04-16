import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("@/pages/HomePage.vue"), meta: { title: "家族首页" } },
    { path: "/about", component: () => import("@/pages/AboutPage.vue"), meta: { title: "关于宗迹" } },
    { path: "/join", component: () => import("@/pages/JoinPage.vue"), meta: { title: "加入家族" } },
    { path: "/login", component: () => import("@/pages/LoginPage.vue"), meta: { title: "昵称进入" } },
    { path: "/map", component: () => import("@/pages/MapPage.vue"), meta: { title: "墓点地图" } },
    { path: "/tombs/:id", component: () => import("@/pages/TombDetailPage.vue"), meta: { title: "墓点详情" } },
    { path: "/tasks", component: () => import("@/pages/TasksPage.vue"), meta: { title: "年度祭扫" } },
    { path: "/routes", component: () => import("@/pages/RoutesPage.vue"), meta: { title: "路线规划" } },
    { path: "/messages", component: () => import("@/pages/MessagesPage.vue"), meta: { title: "祈福留言" } },
    { path: "/me", component: () => import("@/pages/MePage.vue"), meta: { title: "我的" } },
  ],
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? "宗迹")} · 宗迹 KinTrace`;
});
