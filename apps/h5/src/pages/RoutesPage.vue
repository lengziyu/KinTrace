<script setup lang="ts">
import { computed, ref } from "vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const selectedIds = ref<string[]>(sessionStore.routes[0]?.tombIds ?? []);
const previewLoading = ref(false);

function toggleSelection(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
    return;
  }

  selectedIds.value = [...selectedIds.value, id];
}

const selectedTombs = computed(() =>
  selectedIds.value
    .map((id) => sessionStore.tombs.find((tomb) => tomb.id === id))
    .filter((item): item is (typeof sessionStore.tombs)[number] => Boolean(item)),
);

async function generatePreview() {
  previewLoading.value = true;
  try {
    await sessionStore.previewRoute(selectedIds.value);
  } finally {
    previewLoading.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card class="space-y-3">
      <h2 class="text-lg font-semibold">多点路线规划</h2>
      <p class="text-sm text-muted-foreground">
        首期按勾选顺序生成路线结果，后续可以继续升级为地图路径优化与多交通方式规划。
      </p>
      <div class="space-y-2">
        <button
          v-for="tomb in sessionStore.tombs"
          :key="tomb.id"
          class="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left"
          :class="selectedIds.includes(tomb.id) ? 'border-primary bg-primary/5' : 'border-border bg-background'"
          @click="toggleSelection(tomb.id)"
        >
          <div>
            <p class="font-medium">{{ tomb.name }}</p>
            <p class="text-xs text-muted-foreground">{{ tomb.areaName || "未填写片区" }}</p>
          </div>
          <span class="text-sm text-muted-foreground">
            {{ selectedIds.includes(tomb.id) ? "已选中" : "选择" }}
          </span>
        </button>
      </div>
    </Card>

    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">建议顺序</h3>
        <Badge variant="outline">{{ sessionStore.source }}</Badge>
      </div>
      <div class="space-y-2">
        <div
          v-for="(stop, index) in sessionStore.routePreview?.stops ?? selectedTombs.map((tomb, tombIndex) => ({ tomb, order: tombIndex + 1, distanceFromPrevious: tombIndex === 0 ? 0 : 680 }))"
          :key="stop.tomb.id"
          class="flex items-center gap-3 rounded-xl bg-muted/70 px-3 py-3"
        >
          <div class="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {{ stop.order ?? index + 1 }}
          </div>
          <div>
            <p class="font-medium">{{ stop.tomb.name }}</p>
            <p class="text-xs text-muted-foreground">
              {{ stop.tomb.areaName || "未填写片区" }} · 距上一站 {{ stop.distanceFromPrevious }} 米
            </p>
          </div>
        </div>
      </div>
      <div
        v-if="sessionStore.routePreview"
        class="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground"
      >
        总距离约 {{ sessionStore.routePreview.totalDistanceMeters }} 米，预计耗时
        {{ sessionStore.routePreview.estimatedDurationMinutes }} 分钟。
      </div>
      <Button class="w-full" @click="generatePreview">
        {{ previewLoading ? "生成中..." : "生成路线结果" }}
      </Button>
    </Card>
  </div>
</template>
