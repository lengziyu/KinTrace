<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  ChartColors,
  createChart,
  DetailedRenderer,
  HourglassChart,
  type ChartHandle,
} from "topola";
import type { GenealogyChartData, GenealogyPerson } from "@kintrace/shared";

const props = withDefaults(
  defineProps<{
    people: GenealogyPerson[];
    chartData: GenealogyChartData;
    startIndiId?: string | null;
    selectedId?: string;
    emptyText?: string;
  }>(),
  {
    startIndiId: "",
    selectedId: "",
    emptyText: "当前家族还没有可展示的族谱数据。",
  },
);

const emit = defineEmits<{
  select: [personId: string];
}>();

const svgId = `kintrace-h5-genealogy-${Math.random().toString(36).slice(2, 9)}`;
const svgRef = ref<SVGSVGElement | null>(null);
const chartHandle = ref<ChartHandle | null>(null);
const currentStartId = ref("");

const realPersonIds = computed(() => new Set(props.people.map((item) => item.id)));
const hasData = computed(() => props.chartData.indis.length > 0);

function resolveStartId() {
  if (props.selectedId && realPersonIds.value.has(props.selectedId)) {
    return props.selectedId;
  }

  if (props.startIndiId) {
    return props.startIndiId;
  }

  return props.chartData.indis[0]?.id ?? "";
}

async function renderChart() {
  if (!svgRef.value || !hasData.value) {
    return;
  }

  currentStartId.value = resolveStartId();
  await nextTick();

  if (!chartHandle.value) {
    chartHandle.value = createChart({
      json: props.chartData,
      svgSelector: `#${svgId}`,
      chartType: HourglassChart,
      renderer: DetailedRenderer,
      horizontal: true,
      expanders: true,
      animate: true,
      colors: ChartColors.COLOR_BY_GENERATION,
      updateSvgSize: true,
      indiCallback: ({ id }) => {
        if (!realPersonIds.value.has(id)) {
          return;
        }

        currentStartId.value = id;
        emit("select", id);
        void nextTick(() => {
          chartHandle.value?.render({ startIndi: id });
        });
      },
    });
  } else {
    chartHandle.value.setData(props.chartData);
  }

  svgRef.value.innerHTML = "";
  chartHandle.value.render({ startIndi: currentStartId.value });
}

watch(
  () => [props.chartData, props.startIndiId, props.selectedId] as const,
  () => {
    void renderChart();
  },
  { deep: true },
);

onMounted(() => {
  void renderChart();
});
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="hasData"
      class="h5-surface-subtle overflow-auto rounded-[calc(var(--radius)+8px)] border p-3"
    >
      <svg
        :id="svgId"
        ref="svgRef"
        class="min-h-[520px] min-w-[920px]"
      />
    </div>

    <div
      v-else
      class="h5-surface-subtle rounded-[calc(var(--radius)+8px)] border px-5 py-8 text-center text-sm text-muted-foreground"
    >
      {{ emptyText }}
    </div>
  </div>
</template>
