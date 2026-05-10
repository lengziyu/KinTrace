<script setup lang="ts">
import { computed, ref } from "vue";
import { LockKeyhole, Navigation2, Search, X } from "lucide-vue-next";
import { useRouter } from "vue-router";
import MapBoard from "@/components/MapBoard.vue";
import TombCover from "@/components/TombCover.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import { useSessionStore } from "@/stores/session";

const router = useRouter();
const sessionStore = useSessionStore();
const keyword = ref("");

const filteredTombs = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  if (!normalizedKeyword) {
    return sessionStore.tombs;
  }

  return sessionStore.tombs.filter((tomb) =>
    [tomb.name, tomb.areaName, tomb.branchName, tomb.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword)),
  );
});

const activeRoutePreview = computed(() => (keyword.value.trim() ? null : sessionStore.routePreview));

function clearKeyword() {
  keyword.value = "";
}

function openNavigation(lng: number, lat: number, name: string) {
  if (!sessionStore.isAuthenticated) {
    return;
  }

  const encodedName = encodeURIComponent(name);
  window.open(
    `https://uri.amap.com/navigation?to=${lng},${lat},${encodedName}&mode=car&coordinate=gaode&callnative=1`,
    "_blank",
  );
}

function openTombDetail(tombId: string) {
  void router.push(`/tombs/${tombId}`);
}
</script>

<template>
  <div class="space-y-4">
    <div class="h5-animate-in flex items-center gap-3" style="--stagger-delay: 20ms;">
      <div class="min-w-0 flex-1">
        <p class="text-xl font-semibold text-foreground">墓点地图</p>
      </div>
      <div class="relative w-[58%] max-w-[230px] shrink-0">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="keyword" class="h-10 pl-9 pr-10" placeholder="搜索墓点" />
        <button
          v-if="keyword"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          type="button"
          @click="clearKeyword"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>

    <Card
      v-if="!sessionStore.isAuthenticated"
      class="h5-card-lift h5-animate-in space-y-2 border-primary/20 bg-primary/5"
      style="--stagger-delay: 45ms;"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-foreground">当前为只读浏览状态</p>
        <LockKeyhole class="size-4 text-primary" />
      </div>
      <p class="text-xs leading-6 text-muted-foreground">可以查看地图和墓点详情，导航、打卡、留言、上传等操作需要登录后开启。</p>
    </Card>

    <div class="h5-animate-in" style="--stagger-delay: 70ms;">
      <MapBoard
        :tombs="filteredTombs"
        :route-preview="activeRoutePreview"
        :point-marker-preset="sessionStore.appSettings.pointMarkerPreset"
        :point-marker-icon-url="sessionStore.appSettings.pointMarkerIconUrl"
        @select="openTombDetail"
      />
    </div>

    <Card
      v-if="filteredTombs.length === 0"
      class="h5-card-lift h5-animate-in space-y-3 text-center"
      style="--stagger-delay: 160ms;"
    >
      <p class="text-base font-semibold text-foreground">没有匹配的墓点</p>
      <p class="text-sm text-muted-foreground">可以换个关键词试试，或者清空筛选查看全部点位。</p>
      <Button variant="outline" class="w-full" @click="clearKeyword">清空筛选</Button>
    </Card>

    <div v-else class="space-y-3">
      <Card
        v-for="(tomb, index) in filteredTombs"
        :key="tomb.id"
        class="h5-card-lift h5-animate-in cursor-pointer transition hover:border-primary/30 hover:shadow-sm"
        :style="{ '--stagger-delay': `${180 + index * 35}ms` }"
        @click="openTombDetail(tomb.id)"
      >
        <div class="space-y-3">
          <TombCover :tomb="tomb" class="h-36" />
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <Badge :variant="sessionStore.visitedTombIds.includes(tomb.id) ? 'success' : 'outline'">
                  {{ sessionStore.visitedTombIds.includes(tomb.id) ? "已祭扫" : "待祭扫" }}
                </Badge>
              </div>
              <h3 class="mt-3 text-lg font-semibold text-foreground">{{ tomb.name }}</h3>
              <p class="mt-2 text-sm text-muted-foreground">
                {{ tomb.areaName || "未填写片区" }} · {{ tomb.branchName || "未录入支系" }}
              </p>
              <p class="mt-3 text-sm leading-6 text-muted-foreground">{{ tomb.description || "暂无点位说明。" }}</p>
            </div>
            <div class="shrink-0">
              <Button
                class="h-11 min-w-[108px] bg-[hsl(var(--primary))] shadow-[0_10px_24px_rgba(22,103,214,0.22)]"
                :disabled="!sessionStore.isAuthenticated"
                @click.stop="openNavigation(tomb.lng, tomb.lat, tomb.name)"
              >
                <Navigation2 class="mr-1 size-4" />
                {{ sessionStore.isAuthenticated ? "一键导航" : "登录后导航" }}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
