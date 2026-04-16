<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import BrandLogo from "@/components/BrandLogo.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const router = useRouter();
const nickname = ref(sessionStore.member.nickname);
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    await sessionStore.quickLogin(nickname.value || "家族成员", undefined, sessionStore.family.code);
    await router.push("/");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card class="space-y-4 bg-[linear-gradient(135deg,rgba(150,128,101,0.12),transparent),linear-gradient(180deg,rgba(116,142,136,0.12),transparent)]">
      <BrandLogo />
      <div>
        <h2 class="text-lg font-semibold">昵称进入</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          当前版本先使用轻量登录快速进入家族，后续可以继续扩展手机号、短信验证和更细权限。
        </p>
      </div>
      <Input v-model="nickname" placeholder="请输入昵称" />
      <Button class="w-full" @click="submit">
        {{ loading ? "进入中..." : `进入 ${sessionStore.family.name}` }}
      </Button>
      <RouterLink to="/about" class="block text-center text-sm text-primary">
        了解宗迹的产品定位
      </RouterLink>
    </Card>
  </div>
</template>
