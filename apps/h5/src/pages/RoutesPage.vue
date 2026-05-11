<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArrowDown, ArrowUp, BellRing, CalendarDays, Clock3, LockKeyhole, Save } from "lucide-vue-next";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Input from "@/components/ui/Input.vue";
import { formatDate, formatDateTime } from "@/lib/format";
import { resolveScheduleDisplayDate } from "@/lib/schedule";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const saveLoading = ref(false);
const dateSaving = ref(false);
const saveMessage = ref("");
const routeName = ref("");
const routeDescription = ref("");
const selectedIds = ref<string[]>([]);
const morningTombCount = ref(0);
const afternoonTombCount = ref(0);
const worshipDate = ref("");

const currentRoute = computed(() => sessionStore.currentRoute);
const canEditRoute = computed(() => sessionStore.isAuthenticated && sessionStore.canManagePoint);
const routeChangedNoticeVisible = computed(
  () => Boolean(currentRoute.value?.planRevision && currentRoute.value.planRevision > 1 && !sessionStore.canManagePoint),
);
const hasWorshipDate = computed(() => Boolean(worshipDate.value));
const currentScheduleDate = computed(() =>
  resolveScheduleDisplayDate(sessionStore.activeTask?.startDate, sessionStore.family.upcomingWorshipAt),
);

const selectedTombs = computed(() =>
  selectedIds.value
    .map((id) => sessionStore.tombs.find((tomb) => tomb.id === id))
    .filter((item): item is (typeof sessionStore.tombs)[number] => Boolean(item)),
);

const morningStops = computed(() => selectedTombs.value.slice(0, morningTombCount.value));
const afternoonStops = computed(() =>
  selectedTombs.value.slice(morningTombCount.value, morningTombCount.value + afternoonTombCount.value),
);
const unassignedStops = computed(() =>
  selectedTombs.value.slice(morningTombCount.value + afternoonTombCount.value),
);
const unassignedCount = computed(() => unassignedStops.value.length);

const scheduleDays = computed(() => {
  if (!selectedTombs.value.length) {
    return [];
  }

  return [
    {
      key: worshipDate.value || currentScheduleDate.value || "pending",
      dateLabel: formatDate(currentScheduleDate.value || worshipDate.value) || "待设置日期",
      dateTimeLabel: formatDateTime(sessionStore.family.upcomingWorshipAt) || "",
      sections: [
        {
          key: "morning",
          title: `上午先扫 ${morningStops.value.length} 个`,
          stops: morningStops.value.map((tomb, index) => ({
            ...tomb,
            order: index + 1,
          })),
        },
        {
          key: "afternoon",
          title: `下午再扫 ${afternoonStops.value.length} 个`,
          stops: afternoonStops.value.map((tomb, index) => ({
            ...tomb,
            order: morningTombCount.value + index + 1,
          })),
        },
      ].filter((section) => section.stops.length > 0),
      unassignedStops: unassignedStops.value.map((tomb, index) => ({
        ...tomb,
        order: morningTombCount.value + afternoonTombCount.value + index + 1,
      })),
    },
  ];
});

function clampCounts() {
  const total = selectedIds.value.length;
  morningTombCount.value = Math.max(0, Math.min(total, morningTombCount.value));
  const remain = Math.max(total - morningTombCount.value, 0);
  afternoonTombCount.value = Math.max(0, Math.min(remain, afternoonTombCount.value));
}

function syncFromCurrentRoute() {
  routeName.value = currentRoute.value?.name || `${new Date().getFullYear()} 清明主线路`;
  routeDescription.value = currentRoute.value?.description || "";
  selectedIds.value = [...(currentRoute.value?.tombIds ?? [])];
  morningTombCount.value = currentRoute.value?.morningTombCount ?? 0;
  afternoonTombCount.value = currentRoute.value?.afternoonTombCount ?? 0;
  worshipDate.value = sessionStore.family.upcomingWorshipAt
    ? new Date(sessionStore.family.upcomingWorshipAt).toISOString().slice(0, 10)
    : "";
  clampCounts();
}

function toggleSelection(id: string) {
  if (!canEditRoute.value) {
    return;
  }

  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
    clampCounts();
    return;
  }

  selectedIds.value = [...selectedIds.value, id];
  clampCounts();
}

function moveItem(index: number, direction: -1 | 1) {
  if (!canEditRoute.value) {
    return;
  }

  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= selectedIds.value.length) {
    return;
  }

  const next = [...selectedIds.value];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  selectedIds.value = next;
}

function adjustCount(target: "morning" | "afternoon", delta: number) {
  if (!canEditRoute.value || !hasWorshipDate.value) {
    return;
  }

  if (target === "morning") {
    morningTombCount.value += delta;
  } else {
    afternoonTombCount.value += delta;
  }

  clampCounts();
}

async function saveWorshipDate() {
  if (!canEditRoute.value || !worshipDate.value) {
    return;
  }

  dateSaving.value = true;
  saveMessage.value = "";
  try {
    await sessionStore.updateUpcomingWorshipDate(worshipDate.value);
    saveMessage.value = "祭扫日期已保存。";
  } finally {
    dateSaving.value = false;
  }
}

async function saveRoutePlan() {
  if (!canEditRoute.value || selectedIds.value.length === 0 || !hasWorshipDate.value) {
    return;
  }

  saveLoading.value = true;
  saveMessage.value = "";
  try {
    await sessionStore.savePrimaryRoutePlan({
      name: routeName.value || `${new Date().getFullYear()} 清明主线路`,
      description: routeDescription.value,
      tombIds: selectedIds.value,
      morningTombCount: morningTombCount.value,
      afternoonTombCount: afternoonTombCount.value,
    });
    saveMessage.value = "日期、顺序和上午下午安排已保存。";
    syncFromCurrentRoute();
  } finally {
    saveLoading.value = false;
  }
}

watch(currentRoute, syncFromCurrentRoute, { immediate: true });
watch(
  () => sessionStore.family.upcomingWorshipAt,
  () => {
    worshipDate.value = sessionStore.family.upcomingWorshipAt
      ? new Date(sessionStore.family.upcomingWorshipAt).toISOString().slice(0, 10)
      : "";
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-4">
    <Card class="h5-card-lift h5-animate-in space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">当前扫墓线路</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ currentRoute?.name || "管理员尚未设置当前主线路" }}
          </p>
        </div>
        <Badge variant="outline">
          {{ canEditRoute ? "可编辑" : sessionStore.isAuthenticated ? "成员查看" : "未登录只读" }}
        </Badge>
      </div>

      <div v-if="!sessionStore.isAuthenticated" class="rounded-[var(--radius)] border border-primary/20 bg-primary/5 px-4 py-3">
        <div class="flex items-center gap-2 text-sm font-medium text-foreground">
          <LockKeyhole class="size-4 text-primary" />
          登录后可以查看提醒，并参与祭扫协作。
        </div>
      </div>

      <div
        v-if="routeChangedNoticeVisible"
        class="rounded-[var(--radius)] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
      >
        <div class="flex items-center gap-2 font-medium">
          <BellRing class="size-4" />
          线路已变更，请联系管理员确认最新顺序。
        </div>
        <p class="mt-2 text-xs leading-6">
          最近调整时间：{{ formatDateTime(currentRoute?.planUpdatedAt) || "刚刚" }}。日期、顺序和上午下午安排都可能已经变化。
        </p>
      </div>

      <div class="rounded-[var(--radius)] border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        {{ currentRoute?.description || "当前线路按日期分组展示，默认只区分上午和下午，不需要填写具体时刻。" }}
      </div>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-4" style="--stagger-delay: 70ms;">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">当前顺序</h3>
        <Badge variant="outline">版本 {{ currentRoute?.planRevision || 1 }}</Badge>
      </div>

      <div v-if="scheduleDays.length" class="space-y-4">
        <div
          v-for="day in scheduleDays"
          :key="day.key"
          class="py-1"
        >
          <div class="flex items-start justify-between gap-3 rounded-[var(--radius)] bg-muted/45 px-3 py-3">
            <div>
              <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays class="size-4 text-primary" />
                {{ day.dateLabel }}
              </div>
              <p v-if="day.dateTimeLabel" class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 class="size-3.5" />
                {{ day.dateTimeLabel }}
              </p>
            </div>
            <Badge variant="outline">{{ selectedIds.length }} 站</Badge>
          </div>

          <div class="mt-5 space-y-5">
            <div
              v-for="section in day.sections"
              :key="`${day.key}-${section.key}`"
              class="grid gap-3 md:grid-cols-[120px_1fr]"
            >
              <div class="md:pt-1">
                <p class="text-sm font-semibold text-foreground">{{ section.title }}</p>
              </div>

              <div class="relative pl-5">
                <div class="absolute bottom-3 left-[7px] top-3 w-px bg-border/80" />
                <div class="space-y-3">
                  <div
                    v-for="item in section.stops"
                    :key="`${day.key}-${section.key}-${item.id}`"
                    class="relative flex items-center gap-3 rounded-[10px] border bg-background/70 px-3 py-3"
                  >
                    <span class="absolute left-[-19px] top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />
                    <div class="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                      {{ item.order }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-medium">{{ item.name }}</p>
                      <p class="text-xs text-muted-foreground">{{ item.areaName || "未填写片区" }}</p>
                    </div>
                    <div v-if="canEditRoute" class="flex gap-1">
                      <Button size="sm" variant="outline" @click="moveItem(item.order - 1, -1)">
                        <ArrowUp class="size-4" />
                      </Button>
                      <Button size="sm" variant="outline" @click="moveItem(item.order - 1, 1)">
                        <ArrowDown class="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="day.unassignedStops.length"
              class="border-t border-dashed border-border pt-4"
            >
              <p class="text-sm font-medium text-foreground">待现场机动安排 {{ day.unassignedStops.length }} 个</p>
              <p class="mt-2 text-xs leading-6 text-muted-foreground">
                {{ day.unassignedStops.map((item) => item.name).join("、") }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="rounded-[var(--radius)] border border-dashed border-border px-4 py-4 text-sm text-muted-foreground"
      >
        当前还没有设置扫墓顺序。
      </div>

      <div
        v-if="unassignedCount > 0"
        class="rounded-[var(--radius)] border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
      >
        还有 {{ unassignedCount }} 个点位未分配到上午或下午，会在当天按现场情况机动处理。
      </div>
    </Card>

    <Card
      v-if="canEditRoute"
      class="h5-card-lift h5-animate-in space-y-4"
      style="--stagger-delay: 130ms;"
    >
      <div>
        <h3 class="font-semibold">管理员设置</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          先保存日期，再设置上午和下午数量，最后按顺序挑选墓点。
        </p>
      </div>

      <Input v-model="routeName" placeholder="线路名称，例如：清明主线路" />
      <Input v-model="routeDescription" placeholder="补充说明，例如：上午先扫主支，下午走支系" />

      <div class="grid gap-3 md:grid-cols-3">
        <div class="rounded-[var(--radius)] border px-3 py-3">
          <p class="mb-2 text-xs text-muted-foreground">日期</p>
          <Input v-model="worshipDate" type="date" />
          <Button class="mt-3 w-full" size="sm" variant="outline" :disabled="dateSaving || !worshipDate" @click="saveWorshipDate">
            {{ dateSaving ? "保存中..." : "保存日期" }}
          </Button>
        </div>
        <div class="rounded-[var(--radius)] border px-3 py-3">
          <p class="text-xs text-muted-foreground">上午数量</p>
          <div class="mt-3 flex items-center gap-2">
            <Button size="sm" variant="outline" :disabled="!hasWorshipDate" @click="adjustCount('morning', -1)">-1</Button>
            <div class="flex-1 text-center text-lg font-semibold text-foreground">{{ morningTombCount }}</div>
            <Button size="sm" variant="outline" :disabled="!hasWorshipDate" @click="adjustCount('morning', 1)">+1</Button>
          </div>
          <p class="mt-3 text-xs leading-6 text-muted-foreground">
            {{ morningStops.length ? morningStops.map((item) => item.name).join("、") : "未分配" }}
          </p>
        </div>
        <div class="rounded-[var(--radius)] border px-3 py-3">
          <p class="text-xs text-muted-foreground">下午数量</p>
          <div class="mt-3 flex items-center gap-2">
            <Button size="sm" variant="outline" :disabled="!hasWorshipDate" @click="adjustCount('afternoon', -1)">-1</Button>
            <div class="flex-1 text-center text-lg font-semibold text-foreground">{{ afternoonTombCount }}</div>
            <Button size="sm" variant="outline" :disabled="!hasWorshipDate" @click="adjustCount('afternoon', 1)">+1</Button>
          </div>
          <p class="mt-3 text-xs leading-6 text-muted-foreground">
            {{ afternoonStops.length ? afternoonStops.map((item) => item.name).join("、") : "未分配" }}
          </p>
        </div>
      </div>

      <p v-if="!hasWorshipDate" class="text-sm text-amber-600 dark:text-amber-400">
        请先保存祭扫日期，保存后再设置上午和下午数量。
      </p>

      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">点位选择</p>
        <button
          v-for="tomb in sessionStore.tombs"
          :key="tomb.id"
          class="flex w-full items-center justify-between rounded-[var(--radius)] border px-4 py-3 text-left"
          :class="selectedIds.includes(tomb.id) ? 'border-primary bg-primary/5' : 'border-border bg-background'"
          @click="toggleSelection(tomb.id)"
        >
          <div>
            <p class="font-medium">{{ tomb.name }}</p>
            <p class="text-xs text-muted-foreground">{{ tomb.areaName || "未填写片区" }}</p>
          </div>
          <span class="text-sm text-muted-foreground">{{ selectedIds.includes(tomb.id) ? "已加入顺序" : "加入顺序" }}</span>
        </button>
      </div>

      <p v-if="saveMessage" class="text-sm text-emerald-600 dark:text-emerald-400">{{ saveMessage }}</p>

      <Button class="w-full" :disabled="saveLoading || selectedIds.length === 0 || !hasWorshipDate" @click="saveRoutePlan">
        <Save class="mr-1 size-4" />
        {{ saveLoading ? "保存中..." : "保存当前扫墓顺序" }}
      </Button>
    </Card>
  </div>
</template>
