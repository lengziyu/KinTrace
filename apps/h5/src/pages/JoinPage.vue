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
const inviteCode = ref(sessionStore.family.inviteCode);
const nickname = ref(sessionStore.member.nickname);
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    await sessionStore.quickLogin(nickname.value || "家族成员", inviteCode.value);
    await router.push("/");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card class="space-y-4">
      <BrandLogo />
      <div>
        <h2 class="text-lg font-semibold">邀请加入家族</h2>
        <p class="mt-2 text-sm text-muted-foreground">
          首期支持邀请码加入，后续可以继续扩展为带签名的邀请链接和手机号校验。
        </p>
      </div>
      <Input v-model="nickname" placeholder="请输入昵称" />
      <Input v-model="inviteCode" placeholder="请输入邀请码" />
      <Button class="w-full" @click="submit">
        {{ loading ? "加入中..." : `确认加入 ${sessionStore.family.name}` }}
      </Button>
      <RouterLink to="/about" class="block text-center text-sm text-primary">
        查看产品介绍
      </RouterLink>
    </Card>
  </div>
</template>
