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
  "逐步扩展：当前先聚焦核心流程，后续再扩展家族树、通知和代祭能力。",
];

const capabilities = [
  "邀请成员加入家族，并通过手机号完成注册和登录",
  "墓点地图、详情、导航与多点路线规划",
  "年度祭扫进度、已祭扫标记与详情留言",
  "下次祭扫日期与首页倒计时",
  "现场实时位置共享 MVP",
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
        KinTrace 是一套面向家族祭扫协作的地图系统，帮助成员围绕墓点、祭扫任务、路线与现场协作形成更清晰的共同流程。
      </p>
    </Card>

    <Card class="space-y-3">
      <h2 class="text-lg font-semibold">产品原则</h2>
      <div class="space-y-2">
        <p
          v-for="item in principles"
          :key="item"
          class="rounded-[var(--radius)] bg-muted/70 px-4 py-3 text-sm text-muted-foreground"
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
          class="rounded-[var(--radius)] border border-border/70 px-4 py-3 text-sm text-muted-foreground"
        >
          {{ item }}
        </p>
      </div>
    </Card>

    <Card class="space-y-3">
      <h2 class="text-lg font-semibold">点位图标体系</h2>
      <div class="rounded-[var(--radius)] border border-border/70 bg-muted/50 p-4">
        <div class="flex items-center gap-3">
          <img :src="getPointMarkerIcon('star')" alt="" class="h-10 w-10 rounded-[var(--radius)]" />
          <div class="rounded-[var(--radius-md)] bg-[#111827] px-3 py-2 text-sm font-semibold text-white">陈氏祖墓</div>
        </div>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          点位会以“图标 + 名称”的方式直接标在地图上，后台可以切换预设图标，也可以上传家族自定义图标。
        </p>
      </div>
    </Card>

    <Card class="space-y-2">
      <h2 class="text-lg font-semibold">后续方向</h2>
      <p class="text-sm leading-7 text-muted-foreground">
        下一阶段会继续强化产品感，包括更实时的现场协作、更完善的家族设置、路线模板沉淀、图片管理与更清晰的权限体系。
      </p>
    </Card>

    <RouterLink to="/join" class="block">
      <Button class="w-full">通过邀请加入家族</Button>
    </RouterLink>
  </div>
</template>
