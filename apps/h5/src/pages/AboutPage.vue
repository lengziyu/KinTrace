<script setup lang="ts">
import { APP_VERSION } from "@kintrace/shared";
import { RouterLink } from "vue-router";
import BrandLogo from "@/components/BrandLogo.vue";
import Badge from "@/components/ui/Badge.vue";
import Button from "@/components/ui/Button.vue";
import Card from "@/components/ui/Card.vue";
import { getPointMarkerIcon } from "@/lib/point-marker";

const principles = [
  "地图优先：优先解决点位查看、导航、路线与协作定位。",
  "庄重克制：界面不过度娱乐化，适合家族祭扫场景。",
  "逐步扩展：当前只做 MVP，但预留家谱树、代祭和通知能力。",
];

const capabilities = [
  "邀请加入家族与昵称快速进入",
  "点位地图、详情、导航与多点路线规划",
  "年度祭扫任务、已拜标记与祈福留言",
  "下一次家族祭拜时间与首页倒计时",
  "家族实时位置共享 MVP",
];
</script>

<template>
  <div class="space-y-4">
    <Card class="space-y-4 bg-[radial-gradient(circle_at_top_right,rgba(150,128,101,0.18),transparent_42%),linear-gradient(180deg,rgba(116,142,136,0.12),transparent)]">
      <BrandLogo />
      <div class="flex items-center gap-2">
        <Badge variant="outline">Version</Badge>
        <Badge variant="default">{{ APP_VERSION }}</Badge>
      </div>
      <p class="text-sm leading-7 text-muted-foreground">
        宗迹 KinTrace 是一个面向家族祭扫协作的地图系统，帮助家族成员围绕点位、祭扫任务、路线与现场协同形成更清晰的共同流程。
      </p>
    </Card>

    <Card class="space-y-3">
      <h2 class="text-lg font-semibold">产品原则</h2>
      <div class="space-y-2">
        <p
          v-for="item in principles"
          :key="item"
          class="rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground"
        >
          {{ item }}
        </p>
      </div>
    </Card>

    <Card class="space-y-3">
      <h2 class="text-lg font-semibold">当前能力</h2>
      <div class="grid gap-2">
        <p
          v-for="item in capabilities"
          :key="item"
          class="rounded-2xl border border-border/70 px-4 py-3 text-sm text-muted-foreground"
        >
          {{ item }}
        </p>
      </div>
    </Card>

    <Card class="space-y-3">
      <h2 class="text-lg font-semibold">点位图标体系</h2>
      <div class="rounded-2xl border border-border/70 bg-muted/50 p-4">
        <div class="flex items-center gap-3">
          <img :src="getPointMarkerIcon('star')" alt="" class="h-10 w-10 rounded-xl" />
          <div class="rounded-full bg-[#111827] px-3 py-2 text-sm font-semibold text-white">始祖纪念点</div>
        </div>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          点位在地图上会以“图标 + 名称”的方式展示，后台可切换预设图标，也可上传家族自定义图标。
        </p>
      </div>
    </Card>

    <Card class="space-y-2">
      <h2 class="text-lg font-semibold">后续方向</h2>
      <p class="text-sm leading-7 text-muted-foreground">
        下一阶段会继续强化产品感，包括更实时的位置协作、更完善的家族设置、路线模板沉淀、图片管理与更清晰的权限体系。
      </p>
    </Card>

    <div class="flex gap-3">
      <RouterLink to="/login" class="flex-1">
        <Button class="w-full">昵称进入</Button>
      </RouterLink>
      <RouterLink to="/join" class="flex-1">
        <Button variant="outline" class="w-full">邀请加入</Button>
      </RouterLink>
    </div>
  </div>
</template>
