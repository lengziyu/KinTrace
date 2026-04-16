<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { loadAmap } from "@/lib/amap";

const props = defineProps<{
  lng?: number | null;
  lat?: number | null;
}>();

const emit = defineEmits<{
  pick: [payload: { lng: number; lat: number }];
}>();

const mapRef = ref<HTMLDivElement | null>(null);

let mapInstance: any = null;
let marker: any = null;

function updateMarker(AMap: any, lng?: number | null, lat?: number | null) {
  if (!mapInstance) {
    return;
  }

  if (marker) {
    mapInstance.remove(marker);
    marker = null;
  }

  if (lng === null || lng === undefined || lat === null || lat === undefined) {
    return;
  }

  marker = new AMap.Marker({
    position: [lng, lat],
  });
  mapInstance.add(marker);
  mapInstance.setCenter([lng, lat]);
}

async function initMap() {
  if (!mapRef.value) {
    return;
  }

  const AMap = await loadAmap();
  if (!AMap) {
    return;
  }

  await nextTick();

  if (!mapInstance) {
    mapInstance = new AMap.Map(mapRef.value, {
      zoom: 13,
      center: [props.lng ?? 121.4737, props.lat ?? 31.2304],
      mapStyle: "amap://styles/whitesmoke",
      viewMode: "2D",
    });

    mapInstance.on("click", (event: any) => {
      const lng = event.lnglat?.getLng?.() ?? event.lnglat?.lng;
      const lat = event.lnglat?.getLat?.() ?? event.lnglat?.lat;
      if (typeof lng === "number" && typeof lat === "number") {
        updateMarker(AMap, lng, lat);
        emit("pick", { lng, lat });
      }
    });
  }

  updateMarker(AMap, props.lng, props.lat);
}

onMounted(() => {
  void initMap();
});

watch(
  () => [props.lng, props.lat] as const,
  async ([lng, lat]) => {
    const AMap = await loadAmap();
    if (!AMap) {
      return;
    }
    updateMarker(AMap, lng, lat);
  },
);

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = null;
    marker = null;
  }
});
</script>

<template>
  <div ref="mapRef" class="h-56 w-full overflow-hidden rounded-xl border border-border/70" />
</template>
