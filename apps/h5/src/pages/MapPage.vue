<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { Navigation2, RefreshCw } from "lucide-vue-next";
import MapBoard from "@/components/MapBoard.vue";
import TombCover from "@/components/TombCover.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const selectedTombId = ref(sessionStore.tombs[0]?.id ?? null);
const shareBusy = ref(false);
const shareError = ref("");

let refreshTimer: ReturnType<typeof window.setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof window.setInterval> | null = null;

const selectedTomb = computed(
  () => sessionStore.tombs.find((item) => item.id === selectedTombId.value) ?? sessionStore.tombs[0],
);

const activeLocationShare = computed(() => sessionStore.activeLocationShare);
const onlineParticipants = computed(
  () => activeLocationShare.value?.participants.filter((participant) => participant.isOnline) ?? [],
);
const myParticipant = computed(() =>
  activeLocationShare.value?.participants.find((participant) => participant.memberId === sessionStore.member.id) ?? null,
);
const isSharing = computed(() => Boolean(myParticipant.value?.isOnline));
const canCloseSession = computed(
  () => activeLocationShare.value?.startedByMemberId === sessionStore.member.id,
);

function openNavigation(lng: number, lat: number, name: string) {
  const encodedName = encodeURIComponent(name);
  window.open(
    `https://uri.amap.com/navigation?to=${lng},${lat},${encodedName}&mode=car&coordinate=gaode&callnative=1`,
    "_blank",
  );
}

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
  if (sessionStore.source !== "api") {
    return;
  }

  await sessionStore.fetchActiveLocationShare();
}

async function syncHeartbeat() {
  if (!activeLocationShare.value || !isSharing.value) {
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

  if (!isSharing.value || !activeLocationShare.value) {
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

  if (sessionStore.source !== "api") {
    return;
  }

  refreshTimer = window.setInterval(() => {
    void refreshLocationShare();
  }, 10000);
}

async function startOrJoinLocationShare() {
  shareBusy.value = true;
  try {
    const position = await requestPosition();

    if (activeLocationShare.value) {
      await sessionStore.joinLocationShare(activeLocationShare.value.id, position);
    } else {
      const title = sessionStore.activeTask?.name
        ? `${sessionStore.activeTask.name} · 实时位置共享`
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
  if (!activeLocationShare.value) {
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
  if (sessionStore.source === "api") {
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
  () => sessionStore.source,
  () => {
    startRefreshLoop();
    if (sessionStore.source === "api") {
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
    <MapBoard
      :tombs="sessionStore.tombs"
      :selected-tomb-id="selectedTombId"
      :route-preview="sessionStore.routePreview"
      :shared-participants="onlineParticipants"
      :current-member-id="sessionStore.member.id"
      :point-marker-preset="sessionStore.appSettings.pointMarkerPreset"
      :point-marker-icon-url="sessionStore.appSettings.pointMarkerIconUrl"
      @select="selectedTombId = $event"
    />

    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">实时位置共享</p>
          <p class="text-xs text-muted-foreground">
            {{ activeLocationShare ? activeLocationShare.title || "家族实时位置共享" : "当前还没有共享会话" }}
          </p>
        </div>
        <Badge :variant="onlineParticipants.length ? 'success' : 'outline'">
          {{ onlineParticipants.length }} 人在线
        </Badge>
      </div>

      <div class="flex gap-2">
        <Button class="flex-1" @click="startOrJoinLocationShare">
          {{ shareBusy ? "处理中..." : activeLocationShare ? (isSharing ? "重新同步位置" : "加入共享") : "开启共享" }}
        </Button>
        <Button variant="outline" class="flex-1" @click="refreshLocationShare">
          <RefreshCw class="mr-1 size-4" />
          刷新
        </Button>
      </div>

      <Button
        v-if="activeLocationShare && isSharing"
        variant="secondary"
        class="w-full"
        @click="leaveOrCloseLocationShare"
      >
        {{ canCloseSession ? "结束共享会话" : "离开共享" }}
      </Button>

      <p v-if="shareError" class="text-sm text-destructive">{{ shareError }}</p>

      <div v-if="onlineParticipants.length" class="space-y-2">
        <div
          v-for="participant in onlineParticipants"
          :key="participant.id"
          class="rounded-xl bg-muted/70 px-3 py-3"
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

    <Card v-if="selectedTomb" class="space-y-3">
      <TombCover :tomb="selectedTomb" class="h-40" />
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">{{ selectedTomb.name }}</p>
          <p class="text-xs text-muted-foreground">
            {{ selectedTomb.areaName || "未填写片区" }} · {{ selectedTomb.generation || "未录入辈分" }}
          </p>
        </div>
        <Badge variant="outline">{{ sessionStore.source }}</Badge>
      </div>
      <Button class="w-full" @click="openNavigation(selectedTomb.lng, selectedTomb.lat, selectedTomb.name)">
        导航到当前点位
      </Button>
    </Card>

    <div class="space-y-3">
      <Card v-for="tomb in sessionStore.tombs" :key="tomb.id" class="space-y-3">
        <TombCover :tomb="tomb" class="h-36" />
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-semibold">{{ tomb.name }}</h3>
              <Badge :variant="sessionStore.visitedTombIds.includes(tomb.id) ? 'success' : 'outline'">
                {{ sessionStore.visitedTombIds.includes(tomb.id) ? "已拜" : "待祭扫" }}
              </Badge>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ tomb.areaName || "未填写片区" }} · {{ tomb.branchName || "未录入支系" }}
            </p>
          </div>
          <Navigation2 class="mt-1 size-4 text-primary" />
        </div>
        <p class="text-sm text-muted-foreground">{{ tomb.description || "暂无点位介绍。" }}</p>
        <div class="flex gap-2">
          <RouterLink :to="`/tombs/${tomb.id}`" class="flex-1">
            <Button variant="outline" class="w-full">查看详情</Button>
          </RouterLink>
          <Button variant="secondary" class="flex-1" @click="openNavigation(tomb.lng, tomb.lat, tomb.name)">
            一键导航
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
