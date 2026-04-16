<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import { useSessionStore } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";

const sessionStore = useSessionStore();
const themeStore = useThemeStore();
const copyState = ref("复制邀请码");

async function copyInviteCode() {
  try {
    await navigator.clipboard.writeText(sessionStore.family.inviteCode);
    copyState.value = "已复制";
    window.setTimeout(() => {
      copyState.value = "复制邀请码";
    }, 1800);
  } catch {
    copyState.value = "复制失败";
    window.setTimeout(() => {
      copyState.value = "复制邀请码";
    }, 1800);
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-muted-foreground">Member</p>
          <h2 class="mt-2 text-xl font-semibold">{{ sessionStore.member.nickname }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{{ sessionStore.family.name }}</p>
        </div>
        <Badge variant="outline">{{ sessionStore.member.role }}</Badge>
      </div>
    </Card>

    <Card class="space-y-2">
      <p class="text-sm font-semibold">主题模式</p>
      <p class="text-sm text-muted-foreground">当前：{{ themeStore.theme }}</p>
    </Card>

    <Card class="space-y-3">
      <p class="text-sm font-semibold">邀请码</p>
      <p class="text-sm text-muted-foreground">{{ sessionStore.family.inviteCode }}</p>
      <Button variant="outline" class="w-full" @click="copyInviteCode">{{ copyState }}</Button>
    </Card>

    <Card class="space-y-3">
      <p class="text-sm font-semibold">更多</p>
      <div class="flex gap-2">
        <RouterLink to="/about" class="flex-1">
          <Button variant="outline" class="w-full">关于宗迹</Button>
        </RouterLink>
        <RouterLink to="/join" class="flex-1">
          <Button variant="secondary" class="w-full">邀请入口</Button>
        </RouterLink>
      </div>
    </Card>
  </div>
</template>
