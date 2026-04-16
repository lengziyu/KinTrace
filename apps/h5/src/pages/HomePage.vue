<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  ArrowRight,
  CalendarDays,
  MapPinned,
  Route,
  TimerReset,
  UsersRound,
} from "lucide-vue-next";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const now = ref(Date.now());

const progressText = computed(() => `${sessionStore.visitedTombIds.length}/${sessionStore.tombs.length} 已拜`);
const countdown = computed(() => {
  if (!sessionStore.family.upcomingWorshipAt) {
    return null;
  }

  const target = new Date(sessionStore.family.upcomingWorshipAt).getTime();
  const diff = target - now.value;

  if (diff <= 0) {
    return {
      finished: true,
      label: "祭拜时间已到，请尽快出发",
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
    <Card class="space-y-5 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,132,255,0.12),transparent_34%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.92))]">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="h5-kicker">Family Space</p>
          <h2 class="mt-3 text-3xl font-semibold text-foreground">{{ sessionStore.family.name }}</h2>
          <p class="mt-3 max-w-[240px] text-sm leading-6 text-muted-foreground">
            {{ sessionStore.family.description || "家族祭扫协作地图空间" }}
          </p>
        </div>
        <Badge variant="default">{{ progressText }}</Badge>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="h5-surface-subtle rounded-2xl border p-3">
          <p class="text-xs text-muted-foreground">点位</p>
          <p class="mt-3 text-2xl font-semibold text-foreground">{{ sessionStore.tombs.length }}</p>
        </div>
        <div class="h5-surface-subtle rounded-2xl border p-3">
          <p class="text-xs text-muted-foreground">任务</p>
          <p class="mt-3 text-2xl font-semibold text-foreground">{{ sessionStore.tasks.length }}</p>
        </div>
        <div class="h5-surface-subtle rounded-2xl border p-3">
          <p class="text-xs text-muted-foreground">留言</p>
          <p class="mt-3 text-2xl font-semibold text-foreground">{{ sessionStore.messages.length }}</p>
        </div>
      </div>
    </Card>

    <Card class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">家族祭拜倒计时</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{
              sessionStore.family.upcomingWorshipAt
                ? new Date(sessionStore.family.upcomingWorshipAt).toLocaleString("zh-CN")
                : "管理员暂未设置祭拜时间"
            }}
          </p>
        </div>
        <TimerReset class="size-5 text-sky-500" />
      </div>
      <div class="h5-surface-subtle rounded-2xl border p-4">
        <p class="text-xs text-muted-foreground">Countdown</p>
        <p class="mt-2 text-2xl font-semibold text-foreground">
          {{ countdown?.label || "待设置" }}
        </p>
      </div>
    </Card>

    <Card class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">{{ sessionStore.activeTask?.name || "当前无年度任务" }}</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ sessionStore.activeTask?.startDate }} 至 {{ sessionStore.activeTask?.endDate }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="outline">{{ sessionStore.source }}</Badge>
          <CalendarDays class="size-5 text-sky-500" />
        </div>
      </div>
      <div class="h-2 rounded-full bg-[hsl(var(--muted))]">
        <div
          class="h-2 rounded-full bg-[linear-gradient(90deg,#2584ff,#1ec8c0)]"
          :style="{ width: `${sessionStore.tombs.length ? (sessionStore.visitedTombIds.length / sessionStore.tombs.length) * 100 : 0}%` }"
        />
      </div>
      <RouterLink to="/tasks" class="inline-flex items-center gap-1 text-sm text-sky-500">
        查看年度祭扫
        <ArrowRight class="size-4" />
      </RouterLink>
    </Card>

    <div class="grid grid-cols-2 gap-3">
      <RouterLink to="/map">
        <Card class="space-y-3">
          <div class="flex size-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500">
            <MapPinned class="size-5" />
          </div>
          <p class="font-semibold text-foreground">地图协作</p>
          <p class="text-xs leading-6 text-muted-foreground">点位位置、路线与实时位置共享</p>
        </Card>
      </RouterLink>
      <RouterLink to="/routes">
        <Card class="space-y-3">
          <div class="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Route class="size-5" />
          </div>
          <p class="font-semibold text-foreground">路线规划</p>
          <p class="text-xs leading-6 text-muted-foreground">整理多点祭扫顺序与导航路线</p>
        </Card>
      </RouterLink>
    </div>

    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">现场协作</p>
          <p class="mt-1 text-xs text-muted-foreground">地图页可开启实时位置共享，便于现场汇合。</p>
        </div>
        <UsersRound class="size-5 text-violet-500" />
      </div>
      <RouterLink to="/join" class="block">
        <Button variant="outline" class="w-full">查看邀请与加入入口</Button>
      </RouterLink>
    </Card>
  </div>
</template>
