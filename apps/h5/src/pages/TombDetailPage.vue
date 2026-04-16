<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import LocationPickerMap from "@/components/LocationPickerMap.vue";
import TombCover from "@/components/TombCover.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import Textarea from "@/components/ui/Textarea.vue";
import { useSessionStore } from "@/stores/session";

const route = useRoute();
const sessionStore = useSessionStore();
const messageContent = ref("");
const submitting = ref(false);
const detailLoading = ref(false);
const visitChecking = ref(false);
const visitSubmitting = ref(false);
const locationSaving = ref(false);
const photoUploading = ref(false);
const photoCaption = ref("");
const previewImage = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const adminPickedLocation = ref<{ lng: number; lat: number } | null>(null);
const pendingVisitPosition = ref<{ lng: number; lat: number; accuracy: number | null } | null>(null);
const visitCheckResult = ref<{ distanceMeters: number; thresholdMeters: number } | null>(null);

const tombId = computed(() => String(route.params.id ?? ""));
const tombDetail = computed(() => sessionStore.tombDetails[tombId.value] ?? null);
const point = computed(
  () => tombDetail.value?.tomb ?? sessionStore.tombs.find((item) => item.id === tombId.value) ?? sessionStore.tombs[0],
);
const visibleMessages = computed(() =>
  (tombDetail.value?.messages ?? sessionStore.messages.filter((item) => item.tombId === point.value?.id))
    .filter((item) => item.status === "approved" || item.memberId === sessionStore.member.id)
    .slice(0, 6),
);
const recentRecords = computed(() => (tombDetail.value?.records ?? []).slice(0, 5));
const photos = computed(() => tombDetail.value?.photos ?? []);
const isManager = computed(() => sessionStore.canManagePoint);

function memberLabel(memberId: string) {
  return memberId === sessionStore.member.id ? "我" : `成员 ${memberId.slice(-4)}`;
}

function openNavigation() {
  if (!point.value) {
    return;
  }

  const encodedName = encodeURIComponent(point.value.name);
  window.open(
    `https://uri.amap.com/navigation?to=${point.value.lng},${point.value.lat},${encodedName}&mode=car&coordinate=gaode&callnative=1`,
    "_blank",
  );
}

function requestPosition() {
  return new Promise<{ lng: number; lat: number; accuracy: number | null }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("当前浏览器不支持定位能力"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          accuracy: position.coords.accuracy ?? null,
        });
      },
      (error) => {
        reject(new Error(error.message || "定位失败，请检查浏览器授权"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );
  });
}

async function loadDetail() {
  if (!tombId.value) {
    return;
  }

  detailLoading.value = true;
  try {
    await sessionStore.fetchTombDetail(tombId.value, true);
  } finally {
    detailLoading.value = false;
  }
}

async function handleVisitAction() {
  if (!point.value) {
    return;
  }

  visitChecking.value = true;
  try {
    const position = await requestPosition();

    if (isManager.value) {
      const result = sessionStore.checkVisitDistance(point.value.id, position);
      if (!result.allowed) {
        throw new Error(`当前位置距离点位 ${result.distanceMeters} 米，超出允许范围 ${result.thresholdMeters} 米`);
      }

      pendingVisitPosition.value = position;
      visitCheckResult.value = {
        distanceMeters: result.distanceMeters,
        thresholdMeters: result.thresholdMeters,
      };
      return;
    }

    await sessionStore.markVisited(point.value.id, position);
  } finally {
    visitChecking.value = false;
  }
}

async function confirmManagedVisit() {
  if (!point.value || !pendingVisitPosition.value) {
    return;
  }

  visitSubmitting.value = true;
  try {
    await sessionStore.markVisited(point.value.id, pendingVisitPosition.value);
    pendingVisitPosition.value = null;
    visitCheckResult.value = null;
  } finally {
    visitSubmitting.value = false;
  }
}

async function submitMessage() {
  if (!point.value || !messageContent.value.trim()) {
    return;
  }

  submitting.value = true;
  try {
    await sessionStore.addMessage(point.value.id, messageContent.value.trim());
    messageContent.value = "";
  } finally {
    submitting.value = false;
  }
}

async function useCurrentLocationForPoint() {
  if (!point.value) {
    return;
  }

  locationSaving.value = true;
  try {
    const position = await requestPosition();
    adminPickedLocation.value = {
      lng: position.lng,
      lat: position.lat,
    };
  } finally {
    locationSaving.value = false;
  }
}

async function savePointLocation() {
  if (!point.value || !adminPickedLocation.value) {
    return;
  }

  locationSaving.value = true;
  try {
    await sessionStore.updatePointLocation(point.value.id, {
      lng: adminPickedLocation.value.lng,
      lat: adminPickedLocation.value.lat,
    });
    await loadDetail();
  } finally {
    locationSaving.value = false;
  }
}

function openUploadDialog() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !point.value) {
    return;
  }

  photoUploading.value = true;
  try {
    await sessionStore.uploadPointPhoto(point.value.id, file, photoCaption.value.trim() || undefined);
    photoCaption.value = "";
    target.value = "";
    await loadDetail();
  } finally {
    photoUploading.value = false;
  }
}

watch(
  point,
  (nextPoint) => {
    if (!nextPoint) {
      return;
    }

    adminPickedLocation.value = {
      lng: nextPoint.lng,
      lat: nextPoint.lat,
    };
  },
  { immediate: true },
);

watch(
  tombId,
  () => {
    pendingVisitPosition.value = null;
    visitCheckResult.value = null;
    void loadDetail();
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="point" class="space-y-4">
    <Card class="space-y-3">
      <div @click="previewImage = point.coverImage || ''">
        <TombCover :tomb="point" class="h-48" />
      </div>
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {{ point.generation || "未录入辈分" }}
          </p>
          <h2 class="mt-2 text-xl font-semibold">{{ point.name }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ point.titleName || "未录入称谓" }} · {{ point.branchName || "未录入支系" }}
          </p>
        </div>
        <Badge :variant="sessionStore.visitedTombIds.includes(point.id) ? 'success' : 'warning'">
          {{ sessionStore.visitedTombIds.includes(point.id) ? "已拜" : "待祭扫" }}
        </Badge>
      </div>
      <p class="text-sm leading-6 text-muted-foreground">{{ point.description || "暂无点位介绍。" }}</p>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-xl bg-muted/70 p-3">
          <p class="text-xs text-muted-foreground">片区</p>
          <p class="mt-1 font-medium">{{ point.areaName || "未填写" }}</p>
        </div>
        <div class="rounded-xl bg-muted/70 p-3">
          <p class="text-xs text-muted-foreground">坐标</p>
          <p class="mt-1 font-medium">{{ point.lng }}, {{ point.lat }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button class="flex-1" @click="handleVisitAction">
          {{
            visitChecking
              ? "定位中..."
              : isManager
                ? "校验当前位置"
                : "获取当前位置并标记已拜"
          }}
        </Button>
        <Button variant="secondary" class="flex-1" @click="openNavigation">一键导航</Button>
      </div>
      <div v-if="visitCheckResult" class="rounded-xl bg-muted/70 p-3 text-sm text-muted-foreground">
        当前位置距离点位 {{ visitCheckResult.distanceMeters }} 米，已在允许范围 {{ visitCheckResult.thresholdMeters }} 米内。
      </div>
      <Button
        v-if="isManager && pendingVisitPosition"
        class="w-full"
        :disabled="visitSubmitting"
        @click="confirmManagedVisit"
      >
        {{ visitSubmitting ? "提交中..." : "确认标记已拜" }}
      </Button>
    </Card>

    <Card v-if="isManager" class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">点位位置管理</h3>
        <Badge variant="outline">管理员</Badge>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-xl bg-muted/70 p-3">
          <p class="text-xs text-muted-foreground">经度</p>
          <p class="mt-1 font-medium">{{ adminPickedLocation?.lng?.toFixed(6) }}</p>
        </div>
        <div class="rounded-xl bg-muted/70 p-3">
          <p class="text-xs text-muted-foreground">纬度</p>
          <p class="mt-1 font-medium">{{ adminPickedLocation?.lat?.toFixed(6) }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1" @click="useCurrentLocationForPoint">
          {{ locationSaving ? "获取中..." : "使用当前位置" }}
        </Button>
        <Button class="flex-1" @click="savePointLocation">保存点位坐标</Button>
      </div>
      <LocationPickerMap
        :lng="adminPickedLocation?.lng"
        :lat="adminPickedLocation?.lat"
        @pick="adminPickedLocation = $event"
      />
    </Card>

    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">现场图片</h3>
        <Badge variant="outline">{{ photos.length }} 张</Badge>
      </div>
      <Textarea v-model="photoCaption" placeholder="可选：补充这张图片的说明" />
      <input
        ref="fileInputRef"
        class="hidden"
        type="file"
        accept="image/*"
        capture="environment"
        @change="handleFileChange"
      />
      <Button class="w-full" @click="openUploadDialog">
        {{ photoUploading ? "上传中..." : "拍照或上传图片" }}
      </Button>

      <div v-if="photos.length" class="grid grid-cols-3 gap-3">
        <button
          v-for="photo in photos"
          :key="photo.id"
          type="button"
          class="overflow-hidden rounded-xl border border-border/70"
          @click="previewImage = photo.imageUrl"
        >
          <img :src="photo.imageUrl" alt="" class="h-24 w-full object-cover" />
        </button>
      </div>
      <p v-else class="text-sm text-muted-foreground">当前点位还没有现场图片。</p>
    </Card>

    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">写祈福留言</h3>
        <Badge variant="outline">{{ sessionStore.source }}</Badge>
      </div>
      <Textarea v-model="messageContent" placeholder="愿先人安息，愿家族平安和睦。" />
      <Button class="w-full" @click="submitMessage">
        {{ submitting ? "提交中..." : "提交留言" }}
      </Button>
    </Card>

    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">祈福留言</h3>
        <Badge variant="outline">
          {{ detailLoading ? "加载中" : `${visibleMessages.length} 条` }}
        </Badge>
      </div>
      <div v-if="visibleMessages.length" class="space-y-2">
        <div
          v-for="message in visibleMessages"
          :key="message.id"
          class="rounded-xl bg-muted/70 px-3 py-3"
        >
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm font-medium">{{ memberLabel(message.memberId) }}</p>
            <p class="text-xs text-muted-foreground">
              {{ new Date(message.createdAt).toLocaleString("zh-CN") }}
            </p>
          </div>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ message.content }}</p>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">当前点位还没有可展示的留言。</p>
    </Card>

    <Card class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">最近祭扫记录</h3>
        <Badge variant="outline">{{ recentRecords.length }} 条</Badge>
      </div>
      <div v-if="recentRecords.length" class="space-y-2">
        <div
          v-for="record in recentRecords"
          :key="record.id"
          class="rounded-xl border border-border/70 px-3 py-3"
        >
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm font-medium">{{ memberLabel(record.memberId) }}</p>
            <p class="text-xs text-muted-foreground">
              {{ new Date(record.worshipTime).toLocaleString("zh-CN") }}
            </p>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            动作：{{ record.actionType }}{{ record.distanceMeters ? ` · 距离 ${record.distanceMeters} 米` : "" }}
          </p>
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">当前还没有同步到祭扫记录。</p>
    </Card>

    <div
      v-if="previewImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      @click="previewImage = ''"
    >
      <img :src="previewImage" alt="" class="max-h-[80vh] max-w-full rounded-2xl object-contain" />
    </div>
  </div>
</template>
