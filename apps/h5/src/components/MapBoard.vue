<script setup lang="ts">
import type { LocationShareParticipant, RoutePreview, TombPoint } from "@kintrace/shared";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Route } from "lucide-vue-next";
import { loadAmap } from "@/lib/amap";
import { getPointMarkerIcon, type PointMarkerPresetKey } from "@/lib/point-marker";
import { resolveAssetUrl } from "@/lib/http";
import Badge from "./ui/Badge.vue";
import Card from "./ui/Card.vue";

const props = defineProps<{
  tombs: TombPoint[];
  selectedTombId?: string | null;
  routePreview?: RoutePreview | null;
  sharedParticipants?: LocationShareParticipant[];
  currentMemberId?: string | null;
  pointMarkerPreset?: PointMarkerPresetKey;
  pointMarkerIconUrl?: string | null;
}>();

const emit = defineEmits<{
  select: [tombId: string];
}>();

const mapRef = ref<HTMLDivElement | null>(null);
const mapReady = ref(false);

let mapInstance: any = null;
let tombMarkers: any[] = [];
let participantMarkers: any[] = [];
let polyline: any = null;

const hasAmapKey = computed(() => Boolean(import.meta.env.VITE_AMAP_KEY));
const selectedTomb = computed(
  () => props.tombs.find((item) => item.id === props.selectedTombId) ?? props.tombs[0] ?? null,
);
const pointMarkerIcon = computed(() =>
  resolveAssetUrl(getPointMarkerIcon(props.pointMarkerPreset ?? "star", props.pointMarkerIconUrl ?? "")),
);

function clearOverlays() {
  if (!mapInstance) {
    return;
  }

  tombMarkers.forEach((marker) => mapInstance.remove(marker));
  participantMarkers.forEach((marker) => mapInstance.remove(marker));
  tombMarkers = [];
  participantMarkers = [];

  if (polyline) {
    mapInstance.remove(polyline);
    polyline = null;
  }
}

function createTombMarkerContent(tomb: TombPoint) {
  const isSelected = tomb.id === props.selectedTombId;
  const shell = isSelected ? "#2563eb" : "#111827";
  const shadow = isSelected ? "0 14px 30px rgba(37,99,235,.28)" : "0 12px 24px rgba(15,23,42,.18)";
  const border = isSelected ? "rgba(37,99,235,.36)" : "rgba(255,255,255,.08)";
  const name = tomb.name.length > 14 ? `${tomb.name.slice(0, 14)}...` : tomb.name;

  return `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:${shell};border:1px solid ${border};box-shadow:${shadow};color:#f8fafc;white-space:nowrap;">
      <img src="${pointMarkerIcon.value}" alt="" style="width:24px;height:24px;border-radius:8px;display:block;" />
      <span style="font-size:12px;font-weight:600;letter-spacing:.01em;">${name}</span>
    </div>
  `;
}

function createParticipantMarkerContent(participant: LocationShareParticipant) {
  const isCurrentMember = participant.memberId === props.currentMemberId;
  const shell = isCurrentMember ? "#2563eb" : participant.isOnline ? "#0f766e" : "#4b5563";
  const badge = isCurrentMember ? "#93c5fd" : participant.isOnline ? "#99f6e4" : "#d1d5db";
  const name =
    participant.nicknameSnapshot.length > 10
      ? `${participant.nicknameSnapshot.slice(0, 10)}...`
      : participant.nicknameSnapshot;
  const initial = participant.nicknameSnapshot.slice(0, 1);

  return `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;background:${shell};border:1px solid rgba(255,255,255,.08);color:#f8fafc;font-size:12px;box-shadow:0 10px 22px rgba(15,23,42,.18);white-space:nowrap;">
      <div style="width:22px;height:22px;border-radius:999px;background:${badge};color:#0f172a;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">${initial}</div>
      <span style="font-weight:600;letter-spacing:.01em;">${name}${isCurrentMember ? " · 我" : ""}</span>
    </div>
  `;
}

async function renderMap() {
  if (!mapRef.value || !props.tombs.length || !hasAmapKey.value) {
    return;
  }

  const AMap = await loadAmap();

  if (!AMap) {
    return;
  }

  await nextTick();

  if (!mapInstance) {
    mapInstance = new AMap.Map(mapRef.value, {
      zoom: 12,
      center: [props.tombs[0].lng, props.tombs[0].lat],
      mapStyle: "amap://styles/whitesmoke",
      viewMode: "2D",
    });

    mapInstance.addControl(new AMap.Scale());
    mapInstance.addControl(new AMap.ToolBar({ position: "RB" }));
  }

  clearOverlays();

  tombMarkers = props.tombs.map((tomb) => {
    const marker = new AMap.Marker({
      position: [tomb.lng, tomb.lat],
      title: tomb.name,
      content: createTombMarkerContent(tomb),
      offset: new AMap.Pixel(-18, -18),
    });

    marker.on("click", () => {
      emit("select", tomb.id);
    });

    mapInstance.add(marker);
    return marker;
  });

  participantMarkers = (props.sharedParticipants ?? []).map((participant) => {
    const marker = new AMap.Marker({
      position: [participant.lng, participant.lat],
      title: participant.nicknameSnapshot,
      content: createParticipantMarkerContent(participant),
      offset: new AMap.Pixel(-18, -18),
    });

    mapInstance.add(marker);
    return marker;
  });

  if (props.routePreview?.stops?.length) {
    polyline = new AMap.Polyline({
      path: props.routePreview.stops.map((item) => [item.tomb.lng, item.tomb.lat]),
      strokeColor: "#2563eb",
      strokeWeight: 5,
      strokeOpacity: 0.88,
      lineJoin: "round",
      lineCap: "round",
      showDir: true,
    });

    mapInstance.add(polyline);
    mapInstance.setFitView([...tombMarkers, ...participantMarkers, polyline], false, [48, 48, 48, 48]);
    mapReady.value = true;
    return;
  }

  const allMarkers = [...tombMarkers, ...participantMarkers];

  if (props.selectedTombId) {
    const tomb = props.tombs.find((item) => item.id === props.selectedTombId);
    if (tomb) {
      mapInstance.setCenter([tomb.lng, tomb.lat]);
      mapInstance.setZoom(13);
    }
  } else {
    mapInstance.setFitView(allMarkers, false, [48, 48, 48, 48]);
  }

  mapReady.value = true;
}

onMounted(() => {
  void renderMap();
});

watch(
  () =>
    [
      props.tombs,
      props.selectedTombId,
      props.routePreview,
      props.sharedParticipants,
      props.pointMarkerPreset,
      props.pointMarkerIconUrl,
    ] as const,
  () => {
    void renderMap();
  },
  { deep: true },
);

onBeforeUnmount(() => {
  clearOverlays();
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = null;
  }
});
</script>

<template>
  <Card class="overflow-hidden p-0">
    <div class="relative h-72">
      <div ref="mapRef" class="absolute inset-0" />

      <div
        v-if="!hasAmapKey"
        class="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(116,142,136,0.18),transparent),linear-gradient(180deg,rgba(150,128,101,0.18),transparent)]"
      >
        <div class="space-y-3 text-center">
          <img :src="pointMarkerIcon" alt="" class="mx-auto h-12 w-12 rounded-[var(--radius)]" />
          <p class="text-sm font-medium">尚未配置高德地图 Key</p>
        </div>
      </div>

      <div class="absolute left-3 top-3 flex items-center gap-2">
        <Badge :variant="hasAmapKey ? 'success' : 'warning'">
          {{ hasAmapKey ? (mapReady ? "高德地图已加载" : "高德地图加载中") : "等待配置高德 Key" }}
        </Badge>
        <Badge v-if="routePreview?.stops?.length" variant="outline">
          路线 {{ routePreview.stops.length }} 站
        </Badge>
        <Badge v-if="sharedParticipants?.length" variant="outline">
          共享 {{ sharedParticipants.length }} 人
        </Badge>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">
      <span>
        {{
          selectedTomb
            ? `${selectedTomb.name} · ${selectedTomb.areaName || "未填写片区"}`
            : "优先查看点位分布、路线顺序与共享成员位置"
        }}
      </span>
      <Route class="size-4" />
    </div>
  </Card>
</template>
