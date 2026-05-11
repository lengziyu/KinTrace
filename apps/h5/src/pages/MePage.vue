<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import {
  CalendarDays,
  ChevronRight,
  MapPinned,
  RadioTower,
  Settings2,
  ShieldCheck,
} from "lucide-vue-next";
import AnimatedNumber from "@/components/AnimatedNumber.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import { formatDate } from "@/lib/format";
import { resolveAssetUrl } from "@/lib/http";
import { getMemberMonogram } from "@/lib/member";
import { resolveScheduleDisplayDate } from "@/lib/schedule";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const shareBusy = ref(false);
const shareError = ref("");

const memberRoleLabelMap = {
  admin: "管理员",
  manager: "协作成员",
  member: "家族成员",
} as const;

const activeLocationShare = computed(() => sessionStore.activeLocationShare);
const onlineParticipants = computed(
  () => activeLocationShare.value?.participants.filter((participant) => participant.isOnline) ?? [],
);
const myParticipant = computed(() =>
  activeLocationShare.value?.participants.find((participant) => participant.memberId === sessionStore.member.id) ?? null,
);
const isSharing = computed(() => Boolean(myParticipant.value?.isOnline));
const canCloseSession = computed(() => activeLocationShare.value?.startedByMemberId === sessionStore.member.id);
const worshipDate = computed(
  () =>
    formatDate(resolveScheduleDisplayDate(sessionStore.activeTask?.startDate, sessionStore.family.upcomingWorshipAt))
    || "待设置",
);
const profileAvatarUrl = computed(() => resolveAssetUrl(sessionStore.member.avatar));
const memberMonogram = computed(() =>
  getMemberMonogram(sessionStore.isAuthenticated ? sessionStore.member.nickname : "访客"),
);

let refreshTimer: ReturnType<typeof window.setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof window.setInterval> | null = null;

function requestPosition() {
  return new Promise<{ lng: number; lat: number; accuracy: number | null }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("当前浏览器不支持定位能力"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      (error) => {
        reject(new Error(error.message || "定位失败，请检查浏览器授权"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );
  });
}

async function refreshLocationShare() {
  if (sessionStore.source !== "api" || !sessionStore.isAuthenticated) {
    return;
  }

  await sessionStore.fetchActiveLocationShare();
}

async function syncHeartbeat() {
  if (!activeLocationShare.value || !isSharing.value || !sessionStore.isAuthenticated) {
    return;
  }

  try {
    const position = await requestPosition();
    await sessionStore.heartbeatLocationShare(activeLocationShare.value.id, position);
    shareError.value = "";
  } catch (error) {
    shareError.value = error instanceof Error ? error.message : "位置共享更新失败";
  }
}

function startHeartbeatLoop() {
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
  }

  if (!isSharing.value || !activeLocationShare.value || !sessionStore.isAuthenticated) {
    return;
  }

  heartbeatTimer = window.setInterval(() => {
    void syncHeartbeat();
  }, 15000);
}

function startRefreshLoop() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }

  if (sessionStore.source !== "api" || !sessionStore.isAuthenticated) {
    return;
  }

  refreshTimer = window.setInterval(() => {
    void refreshLocationShare();
  }, 10000);
}

async function startOrJoinLocationShare() {
  if (!sessionStore.isAuthenticated) {
    shareError.value = "请先通过邀请链接登录后再开启位置共享";
    return;
  }

  shareBusy.value = true;
  try {
    const position = await requestPosition();

    if (activeLocationShare.value) {
      await sessionStore.joinLocationShare(activeLocationShare.value.id, position);
    } else {
      const title = sessionStore.activeTask?.name
        ? `${sessionStore.activeTask.name} - 实时位置共享`
        : "家族实时位置共享";
      await sessionStore.startLocationShare(position, title);
    }

    shareError.value = "";
    startHeartbeatLoop();
  } catch (error) {
    shareError.value = error instanceof Error ? error.message : "无法开启位置共享";
  } finally {
    shareBusy.value = false;
  }
}

async function leaveOrCloseLocationShare() {
  if (!activeLocationShare.value || !sessionStore.isAuthenticated) {
    return;
  }

  shareBusy.value = true;
  try {
    if (canCloseSession.value) {
      await sessionStore.closeLocationShare(activeLocationShare.value.id);
    } else {
      await sessionStore.leaveLocationShare(activeLocationShare.value.id);
    }
    shareError.value = "";
  } finally {
    shareBusy.value = false;
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }
}

onMounted(() => {
  if (sessionStore.source === "api" && sessionStore.isAuthenticated) {
    void refreshLocationShare().then(() => {
      startHeartbeatLoop();
    });
  }
  startRefreshLoop();
});

watch(isSharing, () => {
  startHeartbeatLoop();
});

watch(
  () => [sessionStore.source, sessionStore.isAuthenticated],
  () => {
    startRefreshLoop();
    if (sessionStore.source === "api" && sessionStore.isAuthenticated) {
      void refreshLocationShare();
    }
  },
);

onBeforeUnmount(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
  }
});
</script>

<template>
  <div class="space-y-4">
    <Card
      class="h5-card-lift h5-animate-in space-y-5 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,132,255,0.18),transparent_36%),linear-gradient(145deg,rgba(37,132,255,0.1),transparent_46%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.94))]"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] text-base font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.26)]">
            <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="" class="h-full w-full object-cover" />
            <span v-else>{{ memberMonogram }}</span>
          </div>
          <div class="min-w-0">
            <p class="h5-kicker">Account Center</p>
            <h2 class="mt-2 truncate text-2xl font-semibold text-foreground">
              {{ sessionStore.isAuthenticated ? sessionStore.member.nickname : "访客" }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ sessionStore.isAuthenticated ? `${sessionStore.family.name} · ${sessionStore.member.phone || "未绑定手机号"}` : "当前可浏览家族公开信息，操作功能需先通过邀请链接登录" }}
            </p>
          </div>
        </div>
        <Badge :variant="sessionStore.isAuthenticated ? 'success' : 'outline'">
          {{ sessionStore.isAuthenticated ? memberRoleLabelMap[sessionStore.member.role] || "已登录" : "未登录" }}
        </Badge>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="h5-surface-subtle rounded-[var(--radius)] border bg-[linear-gradient(180deg,rgba(37,132,255,0.08),transparent)] p-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays class="size-4" />
            下次祭扫
          </div>
          <p class="mt-2 text-sm font-medium text-foreground">{{ worshipDate }}</p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border bg-[linear-gradient(180deg,rgba(30,200,192,0.08),transparent)] p-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPinned class="size-4" />
            可祭扫范围
          </div>
          <p class="mt-2 text-sm font-medium text-foreground">{{ sessionStore.family.visitRangeMeters }} 米</p>
        </div>
      </div>

      <RouterLink to="/me/settings" class="block">
        <div class="h5-list-row">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(37,132,255,0.2),rgba(30,200,192,0.08))] text-primary">
              <Settings2 class="size-4" />
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground">账号设置</p>
              <p class="mt-1 text-xs text-muted-foreground">编辑头像与昵称，复制邀请链接，退出当前登录</p>
            </div>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </div>
      </RouterLink>

      <RouterLink v-if="!sessionStore.isAuthenticated" to="/join" class="block">
        <Button class="w-full">通过邀请链接登录</Button>
      </RouterLink>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 70ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">实时位置共享</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{
              sessionStore.isAuthenticated
                ? activeLocationShare
                  ? activeLocationShare.title || "家族实时位置共享"
                  : "当前还没有共享会话"
                : "登录后可开启共享、同步位置并查看同行成员状态"
            }}
          </p>
        </div>
        <Badge :variant="onlineParticipants.length ? 'success' : 'outline'">
          {{ onlineParticipants.length }} 人在线
        </Badge>
      </div>

      <div class="flex gap-2">
        <Button class="flex-1" :disabled="!sessionStore.isAuthenticated || shareBusy" @click="startOrJoinLocationShare">
          {{ shareBusy ? "处理中..." : activeLocationShare ? (isSharing ? "同步位置" : "加入共享") : "开启共享" }}
        </Button>
        <Button variant="outline" class="flex-1" :disabled="!sessionStore.isAuthenticated" @click="refreshLocationShare">
          刷新状态
        </Button>
      </div>

      <Button
        v-if="activeLocationShare && isSharing && sessionStore.isAuthenticated"
        variant="secondary"
        class="w-full"
        @click="leaveOrCloseLocationShare"
      >
        {{ canCloseSession ? "结束共享" : "离开共享" }}
      </Button>

      <p v-if="shareError" class="text-sm text-destructive">{{ shareError }}</p>

      <div v-if="onlineParticipants.length" class="space-y-2">
        <div
          v-for="participant in onlineParticipants"
          :key="participant.id"
          class="h5-surface-subtle rounded-[var(--radius)] border bg-[linear-gradient(180deg,rgba(37,132,255,0.05),transparent)] px-3 py-3"
        >
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm font-medium">
              {{ participant.nicknameSnapshot }}{{ participant.memberId === sessionStore.member.id ? " · 我" : "" }}
            </p>
            <Badge variant="outline">{{ participant.isOnline ? "在线" : "离线" }}</Badge>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            {{ participant.lng.toFixed(5) }}, {{ participant.lat.toFixed(5) }} ·
            {{ new Date(participant.lastActiveAt).toLocaleTimeString("zh-CN") }}
          </p>
        </div>
      </div>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 130ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">家族概览</p>
          <p class="mt-1 text-xs text-muted-foreground">快速看清当前家族的公开信息和数据规模。</p>
        </div>
        <RadioTower class="size-5 text-sky-500" />
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="h5-surface-subtle rounded-[var(--radius)] border bg-[linear-gradient(180deg,rgba(37,132,255,0.08),transparent)] p-3">
          <p class="text-xs text-muted-foreground">墓点</p>
          <p class="mt-2 text-lg font-semibold text-foreground"><AnimatedNumber :value="sessionStore.tombs.length" /></p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border bg-[linear-gradient(180deg,rgba(30,200,192,0.08),transparent)] p-3">
          <p class="text-xs text-muted-foreground">路线</p>
          <p class="mt-2 text-lg font-semibold text-foreground"><AnimatedNumber :value="sessionStore.routes.length" /></p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border bg-[linear-gradient(180deg,rgba(129,140,248,0.08),transparent)] p-3">
          <p class="text-xs text-muted-foreground">已祭扫</p>
          <p class="mt-2 text-lg font-semibold text-foreground"><AnimatedNumber :value="sessionStore.visitedTombIds.length" /></p>
        </div>
      </div>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 180ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">服务说明</p>
          <p class="mt-1 text-xs text-muted-foreground">了解当前家族空间的协作状态与产品信息。</p>
        </div>
        <ShieldCheck class="size-5 text-primary" />
      </div>
      <RouterLink to="/about" class="block">
        <div class="h5-list-row">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(37,132,255,0.2),rgba(99,102,241,0.08))] text-primary">
              <ShieldCheck class="size-4" />
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground">关于 KinTrace</p>
              <p class="mt-1 text-xs text-muted-foreground">查看产品说明、协作方式和展示版本说明</p>
            </div>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </div>
      </RouterLink>
    </Card>
  </div>
</template>
