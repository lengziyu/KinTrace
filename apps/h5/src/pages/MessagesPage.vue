<script setup lang="ts">
import { computed, ref } from "vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Textarea from "@/components/ui/Textarea.vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const content = ref("");

const latestPoint = computed(() => sessionStore.tombs[0] ?? null);

async function submitMessage() {
  if (!latestPoint.value || !content.value.trim()) {
    return;
  }

  await sessionStore.addMessage(latestPoint.value.id, content.value.trim());
  content.value = "";
}
</script>

<template>
  <div class="space-y-4">
    <Card class="space-y-3">
      <h2 class="text-lg font-semibold">写一段祈福留言</h2>
      <p class="text-sm text-muted-foreground">
        当前默认留言到最近查看的祭扫点位，后续可以继续扩展为按点位选择留言对象。
      </p>
      <Textarea v-model="content" placeholder="愿先人安息，愿家族和睦绵长。" />
      <Button class="w-full" @click="submitMessage">提交留言</Button>
    </Card>

    <Card v-for="message in sessionStore.messages" :key="message.id" class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium">{{ sessionStore.member.nickname }}</p>
        <Badge :variant="message.status === 'approved' ? 'success' : 'warning'">
          {{ message.status === "approved" ? "已审核" : "待审核" }}
        </Badge>
      </div>
      <p class="text-xs text-muted-foreground">
        关联点位：{{ sessionStore.tombs.find((item) => item.id === message.tombId)?.name || "未命名点位" }}
      </p>
      <p class="text-sm leading-6 text-muted-foreground">{{ message.content }}</p>
    </Card>
  </div>
</template>
