<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { CalendarDays, Camera, Copy, LogOut, MapPinned, RadioTower, Save } from "lucide-vue-next";
import AnimatedNumber from "@/components/AnimatedNumber.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import { formatDate } from "@/lib/format";
import { uploadImage } from "@/lib/http";
import { resolveAssetUrl } from "@/lib/http";
import { buildFamilyJoinUrl } from "@/lib/family-entry";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const inviteCodeState = ref("复制邀请码");
const joinLinkState = ref("复制邀请链接");
const shareBusy = ref(false);
const shareError = ref("");
const profileSaving = ref(false);
const profileNickname = ref("");
const avatarPreview = ref("");
const avatarFile = ref<File | null>(null);
const avatarInputRef = ref<HTMLInputElement | null>(null);

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
const worshipDate = computed(() => formatDate(sessionStore.family.upcomingWorshipAt) || "待设置");
const profileAvatarUrl = computed(() => avatarPreview.value || resolveAssetUrl(sessionStore.member.avatar));
const memberInitial = computed(() => (profileNickname.value || sessionStore.member.nickname || "访").slice(0, 1));

let refreshTimer: ReturnType<typeof window.setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof window.setInterval> | null = null;

function resetProfileFields() {
  profileNickname.value = sessionStore.member.nickname || "";
  avatarPreview.value = resolveAssetUrl(sessionStore.member.avatar);
  avatarFile.value = null;
}

function resetLabel(target: typeof inviteCodeState, label: string) {
  window.setTimeout(() => {
    target.value = label;
  }, 1800);
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

async function copyInviteCode() {
  try {
    await navigator.clipboard.writeText(sessionStore.family.inviteCode);
    inviteCodeState.value = "已复制";
  } catch {
    inviteCodeState.value = "复制失败";
  } finally {
    resetLabel(inviteCodeState, "复制邀请码");
  }
}

async function copyJoinLink() {
  try {
    await navigator.clipboard.writeText(buildFamilyJoinUrl(sessionStore.family.inviteCode));
    joinLinkState.value = "已复制";
  } catch {
    joinLinkState.value = "复制失败";
  } finally {
    resetLabel(joinLinkState, "复制邀请链接");
  }
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

function pickAvatar() {
  if (!sessionStore.isAuthenticated) {
    return;
  }

  avatarInputRef.value?.click();
}

function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

async function saveProfile() {
  if (!sessionStore.isAuthenticated) {
    return;
  }

  profileSaving.value = true;
  try {
    let avatar = sessionStore.member.avatar || undefined;

    if (avatarFile.value) {
      const uploaded = await uploadImage(avatarFile.value);
      avatar = uploaded.url;
    }

    await sessionStore.updateMyProfile({
      nickname: profileNickname.value,
      avatar,
    });

    resetProfileFields();
  } finally {
    profileSaving.value = false;
  }
}

async function logout() {
  shareBusy.value = true;
  try {
    await sessionStore.logout();
    resetProfileFields();
  } finally {
    shareBusy.value = false;
  }
}

onMounted(() => {
  resetProfileFields();

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
  () => [sessionStore.source, sessionStore.isAuthenticated, sessionStore.member.avatar, sessionStore.member.nickname],
  () => {
    resetProfileFields();
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
    <Card class="h5-card-lift h5-animate-in space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-primary/12 text-lg font-semibold text-primary">
            <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="" class="h-full w-full object-cover" />
            <span v-else>{{ memberInitial }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">账户状态</p>
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
        <div class="rounded-[var(--radius)] border bg-muted/40 p-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays class="size-4" />
            下次祭扫
          </div>
          <p class="mt-2 text-sm font-medium text-foreground">{{ worshipDate }}</p>
        </div>
        <div class="rounded-[var(--radius)] border bg-muted/40 p-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPinned class="size-4" />
            可祭扫范围
          </div>
          <p class="mt-2 text-sm font-medium text-foreground">{{ sessionStore.family.visitRangeMeters }} 米</p>
        </div>
      </div>

      <RouterLink v-if="!sessionStore.isAuthenticated" to="/join" class="block">
        <Button class="w-full">通过邀请链接登录</Button>
      </RouterLink>
      <Button v-else variant="outline" class="w-full" @click="logout">
        <LogOut class="mr-1 size-4" />
        退出当前登录
      </Button>
    </Card>

    <Card
      v-if="sessionStore.isAuthenticated"
      class="h5-card-lift h5-animate-in space-y-4"
      style="--stagger-delay: 50ms;"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">完善资料</p>
          <p class="mt-1 text-xs text-muted-foreground">昵称不是必填项，这里可以随时补充或修改头像。</p>
        </div>
        <Camera class="size-4 text-muted-foreground" />
      </div>

      <div class="flex items-center gap-3">
        <div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-primary/12 text-lg font-semibold text-primary">
          <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="" class="h-full w-full object-cover" />
          <span v-else>{{ memberInitial }}</span>
        </div>
        <div class="flex-1">
          <Input v-model="profileNickname" placeholder="请输入昵称，可选" />
          <input ref="avatarInputRef" class="hidden" type="file" accept="image/*" @change="handleAvatarChange" />
          <Button variant="outline" size="sm" class="mt-2" @click="pickAvatar">选择头像</Button>
        </div>
      </div>

      <Button class="w-full" :disabled="profileSaving" @click="saveProfile">
        <Save class="mr-1 size-4" />
        {{ profileSaving ? "保存中..." : "保存我的资料" }}
      </Button>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 90ms;">
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
          class="rounded-[var(--radius)] bg-muted/70 px-3 py-3"
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
        <p class="text-sm font-semibold text-foreground">快捷分享</p>
        <Copy class="size-4 text-muted-foreground" />
      </div>
      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" @click="copyInviteCode">{{ inviteCodeState }}</Button>
        <Button size="sm" variant="outline" @click="copyJoinLink">{{ joinLinkState }}</Button>
      </div>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 170ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">家族概览</p>
          <p class="mt-1 text-xs text-muted-foreground">快速看清当前家族的公开信息和数据规模。</p>
        </div>
        <RadioTower class="size-5 text-sky-500" />
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-[var(--radius)] border bg-muted/40 p-3">
          <p class="text-xs text-muted-foreground">墓点</p>
          <p class="mt-2 text-lg font-semibold text-foreground"><AnimatedNumber :value="sessionStore.tombs.length" /></p>
        </div>
        <div class="rounded-[var(--radius)] border bg-muted/40 p-3">
          <p class="text-xs text-muted-foreground">路线</p>
          <p class="mt-2 text-lg font-semibold text-foreground"><AnimatedNumber :value="sessionStore.routes.length" /></p>
        </div>
        <div class="rounded-[var(--radius)] border bg-muted/40 p-3">
          <p class="text-xs text-muted-foreground">已祭扫</p>
          <p class="mt-2 text-lg font-semibold text-foreground"><AnimatedNumber :value="sessionStore.visitedTombIds.length" /></p>
        </div>
      </div>
    </Card>

    <Card class="h5-card-lift h5-animate-in" style="--stagger-delay: 210ms;">
      <RouterLink to="/about" class="block">
        <Button variant="outline" class="w-full">关于 KinTrace</Button>
      </RouterLink>
    </Card>
  </div>
</template>
