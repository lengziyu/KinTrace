<script setup lang="ts">
import Badge from "@/components/ui/Badge.vue";
import Card from "@/components/ui/Card.vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
</script>

<template>
  <div class="space-y-4">
    <Card v-for="task in sessionStore.tasks" :key="task.id" class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">{{ task.name }}</h2>
          <p class="text-sm text-muted-foreground">{{ task.startDate }} 至 {{ task.endDate }}</p>
        </div>
        <Badge variant="success">{{ task.status }}</Badge>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="rounded-xl bg-muted/70 p-3">
          <p class="text-xs text-muted-foreground">总点位</p>
          <p class="mt-2 text-xl font-semibold">{{ sessionStore.tombs.length }}</p>
        </div>
        <div class="rounded-xl bg-muted/70 p-3">
          <p class="text-xs text-muted-foreground">已拜</p>
          <p class="mt-2 text-xl font-semibold">{{ sessionStore.visitedTombIds.length }}</p>
        </div>
        <div class="rounded-xl bg-muted/70 p-3">
          <p class="text-xs text-muted-foreground">待祭扫</p>
          <p class="mt-2 text-xl font-semibold">{{ sessionStore.tombs.length - sessionStore.visitedTombIds.length }}</p>
        </div>
      </div>
    </Card>

    <Card v-if="sessionStore.taskProgress" class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">点位进度明细</h3>
        <Badge variant="outline">{{ sessionStore.source }}</Badge>
      </div>
      <div class="space-y-2">
        <div
          v-for="item in sessionStore.taskProgress.items"
          :key="item.tomb.id"
          class="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-3"
        >
          <div>
            <p class="font-medium">{{ item.tomb.name }}</p>
            <p class="text-xs text-muted-foreground">{{ item.tomb.areaName }}</p>
          </div>
          <Badge :variant="item.visited ? 'success' : 'warning'">
            {{ item.visited ? "已拜" : "待祭扫" }}
          </Badge>
        </div>
      </div>
    </Card>
  </div>
</template>
