<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { Camera, Copy, LogOut, Save } from "lucide-vue-next";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import { resolveAssetUrl, uploadImage } from "@/lib/http";
import { getMemberMonogram } from "@/lib/member";
import { buildFamilyJoinUrl } from "@/lib/family-entry";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const inviteCodeState = ref("复制邀请码");
const joinLinkState = ref("复制邀请链接");
const profileSaving = ref(false);
const actionBusy = ref(false);
const profileNickname = ref("");
const avatarPreview = ref("");
const avatarFile = ref<File | null>(null);
const avatarInputRef = ref<HTMLInputElement | null>(null);

const profileAvatarUrl = computed(() => avatarPreview.value || resolveAssetUrl(sessionStore.member.avatar));
const memberMonogram = computed(() => getMemberMonogram(profileNickname.value || sessionStore.member.nickname || "访客"));

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
  actionBusy.value = true;
  try {
    await sessionStore.logout();
    resetProfileFields();
  } finally {
    actionBusy.value = false;
  }
}

watch(
  () => [sessionStore.isAuthenticated, sessionStore.member.nickname, sessionStore.member.avatar],
  () => {
    resetProfileFields();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-4">
    <Card
      class="h5-card-lift h5-animate-in space-y-5 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,132,255,0.18),transparent_36%),linear-gradient(145deg,rgba(37,132,255,0.1),transparent_46%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.94))]"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] text-lg font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.26)]">
            <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="" class="h-full w-full object-cover" />
            <span v-else>{{ memberMonogram }}</span>
          </div>
          <div class="min-w-0">
            <p class="h5-kicker">Profile Studio</p>
            <h2 class="mt-2 truncate text-2xl font-semibold text-foreground">
              {{ sessionStore.isAuthenticated ? sessionStore.member.nickname : "访客" }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ sessionStore.isAuthenticated ? "把头像、昵称和邀请入口都收进这里，个人中心只保留常用概览。" : "当前未登录，可先浏览公开信息，也可以通过邀请链接进入家族。" }}
            </p>
          </div>
        </div>
        <Badge :variant="sessionStore.isAuthenticated ? 'success' : 'outline'">
          {{ sessionStore.isAuthenticated ? "已登录" : "未登录" }}
        </Badge>
      </div>

      <RouterLink to="/me" class="block">
        <Button variant="outline" class="w-full">返回个人中心</Button>
      </RouterLink>
    </Card>

    <Card
      v-if="sessionStore.isAuthenticated"
      class="h5-card-lift h5-animate-in space-y-4"
      style="--stagger-delay: 60ms;"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">编辑资料</p>
          <p class="mt-1 text-xs text-muted-foreground">头像默认使用姓名后两个字，上传后会直接替换为图片。</p>
        </div>
        <Camera class="size-4 text-muted-foreground" />
      </div>

      <div class="flex items-center gap-3">
        <div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] text-lg font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.26)]">
          <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="" class="h-full w-full object-cover" />
          <span v-else>{{ memberMonogram }}</span>
        </div>
        <div class="flex-1">
          <Input v-model="profileNickname" placeholder="请输入昵称，可选" />
          <input ref="avatarInputRef" class="hidden" type="file" accept="image/*" @change="handleAvatarChange" />
          <Button variant="outline" size="sm" class="mt-2" @click="pickAvatar">选择头像</Button>
        </div>
      </div>

      <Button class="w-full" :disabled="profileSaving" @click="saveProfile">
        <Save class="mr-1 size-4" />
        {{ profileSaving ? "保存中..." : "保存资料" }}
      </Button>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 110ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">邀请入口</p>
          <p class="mt-1 text-xs text-muted-foreground">分享邀请码和家族链接，方便宗亲快速进入当前家族空间。</p>
        </div>
        <Copy class="size-4 text-muted-foreground" />
      </div>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="outline" @click="copyInviteCode">{{ inviteCodeState }}</Button>
        <Button variant="outline" @click="copyJoinLink">{{ joinLinkState }}</Button>
      </div>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-3" style="--stagger-delay: 150ms;">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-foreground">账号动作</p>
          <p class="mt-1 text-xs text-muted-foreground">退出登录也放到这里，避免误触影响首页和个人中心的常用浏览。</p>
        </div>
        <LogOut class="size-4 text-muted-foreground" />
      </div>

      <template v-if="sessionStore.isAuthenticated">
        <Button variant="secondary" class="w-full" :disabled="actionBusy" @click="logout">
          <LogOut class="mr-1 size-4" />
          {{ actionBusy ? "退出中..." : "退出当前登录" }}
        </Button>
      </template>
      <template v-else>
        <RouterLink to="/join" class="block">
          <Button class="w-full">通过邀请链接登录</Button>
        </RouterLink>
      </template>
    </Card>
  </div>
</template>
