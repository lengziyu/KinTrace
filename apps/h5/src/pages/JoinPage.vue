<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import BrandLogo from "@/components/BrandLogo.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const route = useRoute();
const router = useRouter();
const inviteCode = ref(String(route.query.inviteCode || sessionStore.family.inviteCode || ""));
const phone = ref(sessionStore.member.phone || "");
const password = ref("");
const nickname = ref(sessionStore.isAuthenticated ? sessionStore.member.nickname : "");
const loading = ref(false);
const resolvedFamilyName = computed(() => sessionStore.family.name || "当前家族");

async function submit() {
  loading.value = true;
  try {
    await sessionStore.quickLogin({
      phone: phone.value,
      password: password.value,
      nickname: nickname.value || undefined,
      inviteCode: inviteCode.value || sessionStore.family.inviteCode,
      familyCode: String(route.query.familyCode || "") || sessionStore.family.code,
    });
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
        <h2 class="text-lg font-semibold">加入家族</h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          邀请链接会自动带上家族唯一 key。首次进入请设置手机号和密码，后续直接手机号+密码登录。
        </p>
        <p class="mt-2 text-xs text-sky-500">当前识别家族：{{ resolvedFamilyName }}</p>
      </div>
      <Input v-model="phone" inputmode="numeric" maxlength="11" placeholder="请输入手机号" />
      <Input v-model="password" type="password" placeholder="请设置或输入登录密码" />
      <Input v-model="nickname" placeholder="姓名或称呼，可选" />
      <Input v-model="inviteCode" placeholder="请输入家族邀请码" />
      <Button class="w-full" @click="submit">
        {{ loading ? "进入中..." : `进入 ${sessionStore.family.name || "当前家族"}` }}
      </Button>
      <p class="text-xs leading-6 text-muted-foreground">
        姓名不是必填项，进入后可以在“我的”里继续完善头像和昵称。
      </p>
      <RouterLink to="/about" class="block text-center text-sm text-primary">
        查看产品介绍
      </RouterLink>
    </Card>
  </div>
</template>
