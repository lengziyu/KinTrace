<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  BellRing,
  CalendarDays,
  LockKeyhole,
  MapPinned,
  Route,
  TimerReset,
  UsersRound,
} from "lucide-vue-next";
import AnimatedNumber from "@/components/AnimatedNumber.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import { formatDate, formatDateRange } from "@/lib/format";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const now = ref(Date.now());

const sourceLabelMap = {
  api: "实时数据",
  mock: "示例数据",
} as const;

const progressText = computed(() => `${sessionStore.visitedTombIds.length}/${sessionStore.tombs.length} 已祭扫`);
const completionRate = computed(() => {
  if (!sessionStore.tombs.length) {
    return 0;
  }

  return Math.round((sessionStore.visitedTombIds.length / sessionStore.tombs.length) * 100);
});

const activeShareCount = computed(
  () => sessionStore.activeLocationShare?.participants.filter((participant) => participant.isOnline).length ?? 0,
);

const taskDateRange = computed(() =>
  formatDateRange(sessionStore.activeTask?.startDate, sessionStore.activeTask?.endDate),
);
const worshipDate = computed(() => formatDate(sessionStore.family.upcomingWorshipAt));
const statusLabel = computed(() =>
  sessionStore.isAuthenticated ? sourceLabelMap[sessionStore.source] || sessionStore.source : "未登录只读",
);
const currentRoute = computed(() => sessionStore.currentRoute);
const routeChangedNoticeVisible = computed(
  () =>
    Boolean(
      sessionStore.isAuthenticated
      && !sessionStore.canManagePoint
      && currentRoute.value?.planRevision
      && currentRoute.value.planRevision > 1,
    ),
);

const countdown = computed(() => {
  if (!sessionStore.family.upcomingWorshipAt) {
    return null;
  }

  const target = new Date(sessionStore.family.upcomingWorshipAt).getTime();
  const diff = target - now.value;

  if (diff <= 0) {
    return {
      finished: true,
      label: "祭扫时间已到，请尽快出发",
    };
  }

  const totalMinutes = Math.floor(diff / 1000 / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    finished: false,
    label: `${days} 天 ${hours} 小时 ${minutes} 分钟`,
  };
});

let timer: ReturnType<typeof window.setInterval> | null = null;

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <div class="space-y-4">
    <Card
      class="h5-card-lift h5-animate-in space-y-5 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,132,255,0.12),transparent_34%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.92))]"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="h5-kicker">家族空间</p>
          <h2 class="mt-3 text-3xl font-semibold text-foreground">{{ sessionStore.family.name }}</h2>
          <p class="mt-3 max-w-[240px] text-sm leading-6 text-muted-foreground">
            {{ sessionStore.family.description || "家族祭扫协作地图空间" }}
          </p>
        </div>
        <Badge variant="default">{{ progressText }}</Badge>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-3">
          <p class="text-xs text-muted-foreground">点位</p>
          <p class="mt-3 text-2xl font-semibold text-foreground">
            <AnimatedNumber :value="sessionStore.tombs.length" />
          </p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-3">
          <p class="text-xs text-muted-foreground">线路</p>
          <p class="mt-3 text-2xl font-semibold text-foreground">
            <AnimatedNumber :value="sessionStore.routes.length" />
          </p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-3">
          <p class="text-xs text-muted-foreground">共享</p>
          <p class="mt-3 text-2xl font-semibold text-foreground">
            <AnimatedNumber :value="activeShareCount" />
          </p>
        </div>
      </div>
    </Card>

    <Card
      v-if="!sessionStore.isAuthenticated"
      class="h5-card-lift h5-animate-in space-y-3 border-primary/20 bg-primary/5"
      style="--stagger-delay: 45ms;"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-foreground">当前为未登录状态</p>
          <p class="mt-1 text-xs leading-6 text-muted-foreground">
            现在可以浏览首页、地图、线路和我的，打卡、留言、上传、共享位置等操作需要先通过邀请链接登录。
          </p>
        </div>
        <LockKeyhole class="size-5 text-primary" />
      </div>
      <RouterLink to="/join" class="block">
        <Button class="w-full">通过邀请进入家族</Button>
      </RouterLink>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-4" style="--stagger-delay: 80ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">家族祭扫倒计时</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ worshipDate || "管理员暂未设置祭扫日期" }}
          </p>
        </div>
        <TimerReset class="size-5 text-sky-500" />
      </div>
      <div class="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-4">
          <p class="text-xs text-muted-foreground">倒计时</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">
            {{ countdown?.label || "待设置" }}
          </p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-4">
          <p class="text-xs text-muted-foreground">完成进度</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">
            <AnimatedNumber :value="completionRate" suffix="%" />
          </p>
        </div>
      </div>
    </Card>

    <Card
      v-if="routeChangedNoticeVisible"
      class="h5-card-lift h5-animate-in space-y-3 border-amber-500/20 bg-amber-500/10"
      style="--stagger-delay: 100ms;"
    >
      <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BellRing class="size-4 text-amber-500" />
        已改变线路，请联系管理员确认
      </div>
      <p class="text-xs leading-6 text-muted-foreground">
        当前主线路已更新为第 {{ currentRoute?.planRevision }} 版，最近调整时间为
        {{ formatDate(currentRoute?.planUpdatedAt) || "今天" }}。请先和管理员确认上午、下午的扫墓顺序。
      </p>
      <RouterLink to="/routes" class="block">
        <Button variant="outline" class="w-full">查看最新线路</Button>
      </RouterLink>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-4" style="--stagger-delay: 120ms;">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-foreground">{{ sessionStore.activeTask?.name || "当前暂无年度任务" }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ taskDateRange }}</p>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="outline">{{ statusLabel }}</Badge>
          <CalendarDays class="size-5 shrink-0 text-sky-500" />
        </div>
      </div>
      <div class="h-2 rounded-[var(--radius-sm)] bg-[hsl(var(--muted))]">
        <div
          class="h-2 rounded-[var(--radius-sm)] bg-[linear-gradient(90deg,#2584ff,#1ec8c0)] transition-all duration-500"
          :style="{ width: `${completionRate}%` }"
        />
      </div>
      <p class="text-sm leading-6 text-muted-foreground">
        任务信息已经并回首页了，这里直接看时间范围、当前进度和数据状态会更高频。
      </p>
    </Card>

    <div class="grid grid-cols-2 gap-3">
      <RouterLink to="/map">
        <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 150ms;">
          <div class="flex size-11 items-center justify-center rounded-[var(--radius)] bg-sky-500/10 text-sky-500">
            <MapPinned class="size-5" />
          </div>
          <p class="font-semibold text-foreground">墓点地图</p>
          <p class="text-xs leading-6 text-muted-foreground">查看墓点分布、筛选结果和详情入口。</p>
        </Card>
      </RouterLink>
      <RouterLink to="/routes">
        <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 180ms;">
          <div class="flex size-11 items-center justify-center rounded-[var(--radius)] bg-emerald-500/10 text-emerald-500">
            <Route class="size-5" />
          </div>
          <p class="font-semibold text-foreground">线路规划</p>
          <p class="text-xs leading-6 text-muted-foreground">查看当前主线路、上下午安排和扫墓顺序。</p>
        </Card>
      </RouterLink>
    </div>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 210ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">现场协作</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ sessionStore.isAuthenticated ? "位置共享已经放到我的页面了，集合或分头行动时直接去那里开启即可。" : "登录后可开启位置共享、完善资料和复制邀请入口。" }}
          </p>
        </div>
        <UsersRound class="size-5 text-violet-500" />
      </div>
      <div class="flex gap-2">
        <RouterLink to="/me" class="flex-1">
          <Button class="w-full">{{ sessionStore.isAuthenticated ? "前往我的" : "查看我的" }}</Button>
        </RouterLink>
        <RouterLink to="/join" class="flex-1">
          <Button variant="outline" class="w-full">{{ sessionStore.isAuthenticated ? "邀请加入" : "立即进入" }}</Button>
        </RouterLink>
      </div>
    </Card>
  </div>
</template>
