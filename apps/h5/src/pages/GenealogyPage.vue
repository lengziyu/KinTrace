<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  type GenealogyChartData,
  type GenealogyChartIndi,
  type GenealogyPerson,
  type GenealogyTreeView,
} from "@kintrace/shared";
import GenealogyTopolaChart from "@/components/GenealogyTopolaChart.vue";
import Card from "@/components/ui/Card.vue";
import { httpRequest } from "@/lib/http";
import { mockGenealogyPeople } from "@/mock/data";
import { useSessionStore } from "@/stores/session";

const sessionStore = useSessionStore();
const loading = ref(false);
const treeView = ref<GenealogyTreeView | null>(null);
const selectedId = ref("");

function getGenealogySex(gender: GenealogyPerson["gender"]): GenealogyChartIndi["sex"] {
  if (gender === "male") {
    return "M";
  }

  if (gender === "female") {
    return "F";
  }

  return "U";
}

function buildMockChartData(people: GenealogyPerson[]): GenealogyChartData {
  const sorted = [...people].sort((left, right) => {
    if (left.generationLevel !== right.generationLevel) {
      return left.generationLevel - right.generationLevel;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  const childrenByParent = new Map<string, GenealogyPerson[]>();
  const familyIdByPerson = new Map<string, string>();
  const familyIdByChild = new Map<string, string>();
  const spouseMetaByPerson = new Map<
    string,
    { familyId: string; spouseId?: string; spouseName?: string | null; spouseSex: "M" | "F" | "U" }
  >();

  for (const person of sorted) {
    if (!person.parentId) {
      continue;
    }

    const group = childrenByParent.get(person.parentId) ?? [];
    group.push(person);
    childrenByParent.set(person.parentId, group);
  }

  const fams = sorted
    .map((person) => {
      const children = childrenByParent.get(person.id) ?? [];
      const spouseName = person.spouseName?.trim();

      if (children.length === 0 && !spouseName) {
        return null;
      }

      const familyId = `gene-fam-${person.id}`;
      const spouseId = spouseName ? `gene-spouse-${person.id}` : undefined;
      familyIdByPerson.set(person.id, familyId);
      spouseMetaByPerson.set(person.id, {
        familyId,
        spouseId,
        spouseName,
        spouseSex:
          person.gender === "male"
            ? "F"
            : person.gender === "female"
              ? "M"
              : "U",
      });

      for (const child of children) {
        familyIdByChild.set(child.id, familyId);
      }

      if (person.gender === "female") {
        return {
          id: familyId,
          wife: person.id,
          husb: spouseId,
          children: children.map((child) => child.id),
        };
      }

      return {
        id: familyId,
        husb: person.id,
        wife: spouseId,
        children: children.map((child) => child.id),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const indis: GenealogyChartIndi[] = sorted.map((person) => ({
    id: person.id,
    firstName: person.name,
    lastName: [person.generationLabel, person.branchName].filter(Boolean).join(" · ") || undefined,
    famc: familyIdByChild.get(person.id),
    fams: familyIdByPerson.has(person.id) ? [familyIdByPerson.get(person.id)!] : undefined,
    sex: getGenealogySex(person.gender),
    hideId: true,
    hideSex: person.gender === "unknown",
  }));

  const spouseIndis: GenealogyChartIndi[] = sorted
    .map((person) => {
      const spouseMeta = spouseMetaByPerson.get(person.id);
      if (!spouseMeta?.spouseId || !spouseMeta.spouseName) {
        return null;
      }

      return {
        id: spouseMeta.spouseId,
        firstName: spouseMeta.spouseName,
        lastName: "配偶",
        fams: [spouseMeta.familyId],
        sex: spouseMeta.spouseSex,
        hideId: true,
        hideSex: spouseMeta.spouseSex === "U",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    indis: [...indis, ...spouseIndis],
    fams,
  };
}

function buildMockTreeView(familyId: string) {
  const people = mockGenealogyPeople.filter((item) => item.familyId === familyId);

  return {
    familyId,
    people,
    chartData: buildMockChartData(people),
    startIndiId: people.find((item) => !item.parentId)?.id ?? people[0]?.id ?? null,
  } satisfies GenealogyTreeView;
}

const currentPeople = computed(() => treeView.value?.people ?? []);
const selectedPerson = computed(
  () => currentPeople.value.find((item) => item.id === selectedId.value) ?? currentPeople.value[0] ?? null,
);
const quickFocusOptions = computed(() =>
  currentPeople.value.map((item) => ({
    label: `${item.name} · ${item.generationLabel}`,
    value: item.id,
  })),
);

function handleSelect(personId: string) {
  selectedId.value = personId;
}

function statusLabel(value?: GenealogyPerson["status"]) {
  return value === "deceased" ? "已故" : "在世";
}

function genderLabel(value?: GenealogyPerson["gender"]) {
  if (value === "female") return "女";
  if (value === "male") return "男";
  return "未设置";
}

async function loadTree() {
  if (!sessionStore.family.id) {
    return;
  }

  loading.value = true;
  try {
    const view = await httpRequest<GenealogyTreeView>(`genealogy/tree?familyId=${sessionStore.family.id}`);
    treeView.value = view;
  } catch {
    treeView.value = buildMockTreeView(sessionStore.family.id);
  } finally {
    selectedId.value = treeView.value?.startIndiId ?? treeView.value?.people[0]?.id ?? "";
    loading.value = false;
  }
}

watch(
  () => sessionStore.family.id,
  () => {
    void loadTree();
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-4">
    <Card
      class="h5-card-lift h5-animate-in space-y-4 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(37,132,255,0.12),transparent_34%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.92))]"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="h5-kicker">Family Scroll</p>
          <h2 class="mt-3 text-3xl font-semibold text-foreground">Topola 族谱树</h2>
          <p class="mt-3 text-sm leading-7 text-muted-foreground">
            当前族谱以 Topola 风格展示，可左右滑动查看整张谱图，点击人物节点可切换聚焦。
          </p>
        </div>
        <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {{ currentPeople.length }} 人
        </span>
      </div>

      <div class="h5-surface-subtle rounded-[calc(var(--radius)+6px)] border p-3">
        <label class="text-xs uppercase tracking-[0.24em] text-muted-foreground">快速聚焦</label>
        <select
          v-model="selectedId"
          class="mt-3 w-full rounded-[var(--radius)] border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option
            v-for="option in quickFocusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </Card>

    <Card class="h5-card-lift h5-animate-in space-y-4" style="--stagger-delay: 70ms;">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-foreground">族谱图卷</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ loading ? "正在加载族谱数据..." : "建议横向滑动浏览整棵家族树" }}
          </p>
        </div>
        <span class="text-xs text-muted-foreground">Topola</span>
      </div>

      <GenealogyTopolaChart
        :people="currentPeople"
        :chart-data="treeView?.chartData || { indis: [], fams: [] }"
        :start-indi-id="treeView?.startIndiId || ''"
        :selected-id="selectedId"
        empty-text="当前家族还没有录入族谱人物。"
        @select="handleSelect"
      />
    </Card>

    <Card
      v-if="selectedPerson"
      class="h5-card-lift h5-animate-in space-y-4"
      style="--stagger-delay: 120ms;"
    >
      <div>
        <p class="h5-kicker">Person Detail</p>
        <h3 class="mt-3 text-2xl font-semibold text-foreground">{{ selectedPerson.name }}</h3>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-3">
          <p class="text-xs text-muted-foreground">世代 / 性别</p>
          <p class="mt-2 text-sm font-medium text-foreground">
            {{ selectedPerson.generationLabel }} · {{ genderLabel(selectedPerson.gender) }}
          </p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-3">
          <p class="text-xs text-muted-foreground">支系 / 状态</p>
          <p class="mt-2 text-sm font-medium text-foreground">
            {{ selectedPerson.branchName || "未分支" }} · {{ statusLabel(selectedPerson.status) }}
          </p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-3">
          <p class="text-xs text-muted-foreground">上代人物</p>
          <p class="mt-2 text-sm font-medium text-foreground">
            {{ currentPeople.find((item) => item.id === selectedPerson.parentId)?.name || "根节点" }}
          </p>
        </div>
        <div class="h5-surface-subtle rounded-[var(--radius)] border p-3">
          <p class="text-xs text-muted-foreground">配偶</p>
          <p class="mt-2 text-sm font-medium text-foreground">
            {{ selectedPerson.spouseName || "未录入" }}
          </p>
        </div>
      </div>

      <div class="h5-surface-subtle rounded-[var(--radius)] border p-4">
        <p class="text-xs text-muted-foreground">人物说明</p>
        <p class="mt-2 text-sm leading-7 text-foreground/80">
          {{ selectedPerson.bio || "暂无人物说明" }}
        </p>
      </div>
    </Card>
  </div>
</template>
