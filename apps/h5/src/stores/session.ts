import {
  FamilyMemberRole,
  LocationShareSessionStatus,
  MessageStatus,
  RecordActionType,
  STORAGE_KEYS,
  type AppSettings,
  type FamilyGroup,
  type FamilyMember,
  type FamilyOverview,
  type LocationShareSession,
  type MemorialMessage,
  type RoutePlan,
  type RoutePreview,
  type TaskProgress,
  type TombDetail,
  type TombPhoto,
  type TombPoint,
  type WorshipRecord,
  type WorshipTask,
} from "@kintrace/shared";
import { defineStore } from "pinia";
import { httpRequest, uploadImage } from "@/lib/http";
import { readFamilyEntryQuery } from "@/lib/family-entry";
import {
  mockFamily,
  mockMember,
  mockMessages,
  mockRoutes,
  mockTasks,
  mockTombs,
} from "@/mock/data";

type DataSource = "api" | "mock";

type LocationPayload = {
  lng: number;
  lat: number;
  accuracy?: number | null;
};

type FamilyEntrySource =
  | "invite-link"
  | "family-link"
  | "direct-family"
  | "cached-family"
  | "default-family";

const defaultAppSettings: AppSettings = {
  appNameZh: "宗迹",
  appNameEn: "KinTrace Admin",
  logoUrl: "",
  iconUrl: "/kintrace-logo.svg",
  pointMarkerPreset: "star",
  pointMarkerIconUrl: "",
};
defaultAppSettings.appNameZh = "宗迹";

function buildMockProgress(tombs: TombPoint[]) {
  const completed = 1;
  const total = tombs.length;
  return {
    task: mockTasks[0],
    summary: {
      total,
      completed,
      pending: Math.max(total - completed, 0),
      completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    },
    items: tombs.map((tomb, index) => ({
      tomb,
      visited: index === 0,
      latestRecord: null,
    })),
  } satisfies TaskProgress;
}

function buildMockDetail(tombId: string, tombs: TombPoint[], messages: MemorialMessage[]) {
  const tomb = tombs.find((item) => item.id === tombId) ?? tombs[0];

  if (!tomb) {
    return null;
  }

  return {
    tomb,
    messages: messages.filter((item) => item.tombId === tomb.id),
    records: [],
    photos: [],
  } satisfies TombDetail;
}

function buildMockLocationShare(member: FamilyMember): LocationShareSession {
  return {
    id: "mock-location-session",
    familyId: mockFamily.id,
    /*
    title: "清明同行共享",
    title: "清明同行共享",
    */
    status: LocationShareSessionStatus.ACTIVE,
    title: "\u6e05\u660e\u540c\u884c\u5171\u4eab",
    startedByMemberId: member.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    endedAt: null,
    participants: [
      {
        id: "mock-location-participant",
        sessionId: "mock-location-session",
        memberId: member.id,
        nicknameSnapshot: member.nickname,
        lng: mockTombs[0]?.lng ?? 121.4737,
        lat: mockTombs[0]?.lat ?? 31.2304,
        accuracy: 15,
        isOnline: true,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(
  leftLat: number,
  leftLng: number,
  rightLat: number,
  rightLng: number,
) {
  const earthRadius = 6371000;
  const deltaLat = degreesToRadians(rightLat - leftLat);
  const deltaLng = degreesToRadians(rightLng - leftLng);
  const startLat = degreesToRadians(leftLat);
  const endLat = degreesToRadians(rightLat);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(deltaLng / 2) ** 2;

  return Math.round(
    2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

export const useSessionStore = defineStore("h5-session", {
  state: () => ({
    source: "mock" as DataSource,
    loading: false,
    initialized: false,
    isAuthenticated: Boolean(localStorage.getItem(STORAGE_KEYS.h5Token)),
    error: "",
    family: mockFamily as FamilyGroup,
    member: mockMember as FamilyMember,
    tombs: mockTombs as TombPoint[],
    tasks: mockTasks as WorshipTask[],
    messages: mockMessages as MemorialMessage[],
    routes: mockRoutes as RoutePlan[],
    appSettings: { ...defaultAppSettings } as AppSettings,
    visitedTombIds: ["tomb-1"] as string[],
    taskProgress: buildMockProgress(mockTombs) as TaskProgress | null,
    routePreview: null as RoutePreview | null,
    tombDetails: {} as Record<string, TombDetail>,
    activeLocationShare: null as LocationShareSession | null,
    entrySource: "default-family" as FamilyEntrySource,
    entryHint: "当前为默认家族空间",
  }),
  getters: {
    activeTask(state) {
      return state.tasks[0] ?? null;
    },
    currentRoute(state) {
      return state.routes.find((item) => item.isPrimary) ?? state.routes[0] ?? null;
    },
    isGuest(state) {
      return !state.isAuthenticated;
    },
    isLocationSharingActive(state) {
      return state.activeLocationShare?.status === LocationShareSessionStatus.ACTIVE;
    },
    canManagePoint(state) {
      return [FamilyMemberRole.ADMIN, FamilyMemberRole.MANAGER].includes(state.member.role);
    },
  },
  actions: {
    applyOverview(overview: FamilyOverview, tasks: WorshipTask[], messages: MemorialMessage[]) {
      this.family = overview.family;
      this.tombs = overview.tombs;
      this.tasks = tasks.length > 0 ? tasks : overview.currentTask ? [overview.currentTask] : [];
      this.messages = messages.length > 0 ? messages : overview.latestMessages;
      this.routes = overview.routePlans;
      this.visitedTombIds = [];
      this.tombDetails = {};
      this.activeLocationShare = overview.activeLocationShare;
      localStorage.setItem(STORAGE_KEYS.familyId, overview.family.id);
    },

    useMockData(message = "") {
      this.source = "mock";
      this.isAuthenticated = Boolean(localStorage.getItem(STORAGE_KEYS.h5Token));
      this.error = message;
      this.family = mockFamily;
      this.member = this.isAuthenticated
        ? mockMember
        : {
            ...mockMember,
            nickname: "访客",
            phone: null,
            avatar: null,
            role: FamilyMemberRole.MEMBER,
          };
      this.tombs = mockTombs;
      this.tasks = mockTasks;
      this.messages = mockMessages;
      this.routes = mockRoutes;
      this.appSettings = { ...defaultAppSettings };
      this.visitedTombIds = ["tomb-1"];
      this.taskProgress = buildMockProgress(mockTombs);
      this.routePreview = null;
      this.tombDetails = {};
      this.activeLocationShare = null;
      this.entrySource = "default-family";
      this.entryHint = "当前展示示例家族空间";
      this.entryHint = "当前展示的是示例家族空间";
    },

    setEntryMeta(source: FamilyEntrySource, familyName?: string) {
      this.entrySource = source;

      if (source === "invite-link") {
        this.entryHint = familyName ? `已根据邀请链接进入 ${familyName}` : "已根据邀请链接进入当前家族";
        return;
      }

      if (source === "family-link") {
        this.entryHint = familyName ? `已根据家族链接进入 ${familyName}` : "已根据家族链接进入当前家族";
        return;
      }

      if (source === "direct-family") {
        this.entryHint = familyName ? `已根据家族 ID 进入 ${familyName}` : "已根据家族 ID 进入当前家族";
        return;
      }

      if (source === "cached-family") {
        this.entryHint = familyName ? `已恢复上次进入的 ${familyName}` : "已恢复上次进入的家族";
        return;
      }

      this.entryHint = familyName ? `${familyName} 是当前默认家族空间` : "当前为默认家族空间";
    },

    async bootstrap() {
      if (this.loading) {
        return;
      }

      this.loading = true;
      this.error = "";

      try {
        const entryQuery = readFamilyEntryQuery();
        const cachedFamilyId = localStorage.getItem(STORAGE_KEYS.familyId);
        let familyId = cachedFamilyId;
        let entrySource: FamilyEntrySource = cachedFamilyId ? "cached-family" : "default-family";

        if (entryQuery.inviteCode || entryQuery.familyCode) {
          const search = new URLSearchParams();
          if (entryQuery.familyCode) {
            search.set("familyCode", entryQuery.familyCode);
          }
          if (entryQuery.inviteCode) {
            search.set("inviteCode", entryQuery.inviteCode);
          }

          const resolvedFamily = await httpRequest<FamilyGroup | null>(`families/resolve/access?${search.toString()}`);
          if (resolvedFamily?.id) {
            familyId = resolvedFamily.id;
            localStorage.setItem(STORAGE_KEYS.familyId, resolvedFamily.id);
            if (cachedFamilyId && cachedFamilyId !== resolvedFamily.id) {
              localStorage.removeItem(STORAGE_KEYS.memberId);
            }
            entrySource = entryQuery.inviteCode ? "invite-link" : "family-link";
          } else {
            this.error = "未找到链接对应的家族，已尝试使用本地缓存或默认家族。";
          }
        } else if (entryQuery.familyId) {
          familyId = entryQuery.familyId;
          localStorage.setItem(STORAGE_KEYS.familyId, entryQuery.familyId);
          if (cachedFamilyId && cachedFamilyId !== entryQuery.familyId) {
            localStorage.removeItem(STORAGE_KEYS.memberId);
          }
          entrySource = "direct-family";
        }

        if (!familyId && (entryQuery.inviteCode || entryQuery.familyCode) && this.error) {
          this.error = "\u672a\u627e\u5230\u94fe\u63a5\u5bf9\u5e94\u7684\u5bb6\u65cf\uff0c\u5df2\u5c1d\u8bd5\u4f7f\u7528\u672c\u5730\u7f13\u5b58\u6216\u9ed8\u8ba4\u5bb6\u65cf\u3002";
          this.error = "未找到链接对应的家族，已尝试使用本地缓存或默认家族。";
        }

        if (!familyId) {
          const families = await httpRequest<FamilyGroup[]>("families");
          familyId = families.find((item) => item.code === mockFamily.code)?.id ?? families[0]?.id;
          entrySource = "default-family";
        }

        if (!familyId && (entryQuery.inviteCode || entryQuery.familyCode) && this.error) {
          this.error = "\u672a\u627e\u5230\u94fe\u63a5\u5bf9\u5e94\u7684\u5bb6\u65cf\uff0c\u5df2\u5c1d\u8bd5\u4f7f\u7528\u672c\u5730\u7f13\u5b58\u6216\u9ed8\u8ba4\u5bb6\u65cf\u3002";
        }

        if (!familyId) {
          throw new Error("\u6682\u672a\u67e5\u8be2\u5230\u5bb6\u65cf\u6570\u636e");
          throw new Error("暂未查询到家族数据");
        }

        const hasMemberToken = Boolean(localStorage.getItem(STORAGE_KEYS.h5Token));
        this.isAuthenticated = hasMemberToken;
        const [overview, appSettings] = await Promise.all([
          httpRequest<FamilyOverview>(`families/${familyId}/overview`),
          httpRequest<AppSettings>("app-settings"),
        ]);

        let tasks = overview.currentTask ? [overview.currentTask] : [];
        let messages = overview.latestMessages;
        let members: FamilyMember[] = [];

        if (hasMemberToken) {
          try {
            [tasks, messages, members] = await Promise.all([
              httpRequest<WorshipTask[]>(`worship-tasks?familyId=${familyId}`),
              httpRequest<MemorialMessage[]>(`memorial-messages?familyId=${familyId}`),
              httpRequest<FamilyMember[]>(`members?familyId=${familyId}`),
            ]);
          } catch (protectedError) {
            localStorage.removeItem(STORAGE_KEYS.h5Token);
            localStorage.removeItem(STORAGE_KEYS.memberId);
            this.isAuthenticated = false;
            this.error =
              protectedError instanceof Error
                ? protectedError.message
                : "成员登录状态已失效，请重新进入家族。";
          }
          if (!localStorage.getItem(STORAGE_KEYS.h5Token)) {
            this.isAuthenticated = false;
            this.error = "\u6210\u5458\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u8fdb\u5165\u5bb6\u65cf\u3002";
          }
        }

        this.applyOverview(overview, tasks, messages);
        this.appSettings = {
          ...defaultAppSettings,
          ...appSettings,
        };
        this.source = "api";
        this.setEntryMeta(entrySource, overview.family.name);
        this.isAuthenticated = hasMemberToken && members.length > 0;

        if (members.length > 0) {
          const cachedMemberId = localStorage.getItem(STORAGE_KEYS.memberId);
          this.member = members.find((item) => item.id === cachedMemberId) ?? members[0] ?? this.member;

          if (this.member?.id) {
            localStorage.setItem(STORAGE_KEYS.memberId, this.member.id);
          }
        } else {
          this.member = {
            ...mockMember,
            familyId: overview.family.id,
            nickname: "访客",
            phone: null,
            avatar: null,
            role: FamilyMemberRole.MEMBER,
          };
        }

        if (members.length > 0 && this.activeTask) {
          this.taskProgress = await httpRequest<TaskProgress>(`worship-tasks/${this.activeTask.id}/progress`);
          this.visitedTombIds = this.taskProgress.items.filter((item) => item.visited).map((item) => item.tomb.id);
        } else {
          this.taskProgress = null;
          this.visitedTombIds = [];
        }
      } catch (error) {
        if (error instanceof Error) {
          this.useMockData(error.message);
          return;
        }

        this.useMockData("\u63a5\u53e3\u6682\u4e0d\u53ef\u7528\uff0c\u5df2\u56de\u9000\u5230\u793a\u4f8b\u6570\u636e");
        return;
        /*
        this.useMockData(error instanceof Error ? error.message : "接口暂不可用，已回退到示例数据");
        */
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    async quickLogin(payload: {
      phone: string;
      nickname?: string;
      inviteCode?: string;
      familyCode?: string;
    }) {
      const result = await httpRequest<{
        accessToken: string;
        family: FamilyGroup;
        member: FamilyMember;
      }>("auth/member/quick-login", {
        method: "POST",
        body: JSON.stringify({
          phone: payload.phone,
          nickname: payload.nickname?.trim() || undefined,
          inviteCode: payload.inviteCode,
          familyCode: payload.familyCode,
        }),
      });

      localStorage.setItem(STORAGE_KEYS.h5Token, result.accessToken);
      localStorage.setItem(STORAGE_KEYS.familyId, result.family.id);
      localStorage.setItem(STORAGE_KEYS.memberId, result.member.id);
      this.isAuthenticated = true;
      this.family = result.family;
      this.member = result.member;

      await this.bootstrap();
    },

    async updateMyProfile(payload: { nickname?: string; avatar?: string }) {
      const member = await httpRequest<FamilyMember>("members/me", {
        method: "PATCH",
        body: JSON.stringify({
          nickname: payload.nickname?.trim() || undefined,
          avatar: payload.avatar?.trim() || undefined,
        }),
      });

      this.member = member;
      localStorage.setItem(STORAGE_KEYS.memberId, member.id);
      return member;
    },

    async updateUpcomingWorshipDate(dateValue: string | null) {
      const upcomingWorshipAt = dateValue ? `${dateValue}T08:30:00+08:00` : null;

      if (this.source !== "api") {
        this.family = {
          ...this.family,
          upcomingWorshipAt,
        };
        return this.family;
      }

      const family = await httpRequest<FamilyGroup>(`families/${this.family.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          upcomingWorshipAt,
        }),
      });

      this.family = family;
      return family;
    },

    async fetchTombDetail(tombId: string, force = false) {
      if (!force && this.tombDetails[tombId]) {
        return this.tombDetails[tombId];
      }

      const fallbackDetail = buildMockDetail(tombId, this.tombs, this.messages);

      if (this.source !== "api" || !this.isAuthenticated) {
        if (fallbackDetail) {
          this.tombDetails[tombId] = fallbackDetail;
        }
        return fallbackDetail;
      }

      const detail = await httpRequest<TombDetail>(`tombs/${tombId}`);
      this.tombDetails[tombId] = detail;
      return detail;
    },

    async logout() {
      localStorage.removeItem(STORAGE_KEYS.h5Token);
      localStorage.removeItem(STORAGE_KEYS.memberId);
      this.isAuthenticated = false;
      this.activeLocationShare = null;
      this.taskProgress = null;
      this.visitedTombIds = [];
      this.member = {
        ...mockMember,
        nickname: "访客",
        phone: null,
        avatar: null,
        role: FamilyMemberRole.MEMBER,
      };
      await this.bootstrap();
    },

    checkVisitDistance(tombId: string, position: LocationPayload) {
      const point = this.tombs.find((item) => item.id === tombId);
      if (!point) {
        return {
          allowed: false,
          distanceMeters: Infinity,
          thresholdMeters: this.family.visitRangeMeters,
        };
      }

      const distanceMeters = calculateDistanceMeters(position.lat, position.lng, point.lat, point.lng);
      return {
        allowed: distanceMeters <= this.family.visitRangeMeters,
        distanceMeters,
        thresholdMeters: this.family.visitRangeMeters,
      };
    },

    async markVisited(tombId: string, position?: LocationPayload) {
      if (this.source !== "api" || !this.activeTask || !this.member?.id) {
        if (!this.visitedTombIds.includes(tombId)) {
          this.visitedTombIds.push(tombId);
        }
        const tomb = this.tombs.find((item) => item.id === tombId);
        if (tomb) {
          const checkResult = position ? this.checkVisitDistance(tombId, position) : null;
          const record: WorshipRecord = {
            id: `record-${Date.now()}`,
            taskId: this.activeTask?.id ?? "mock-task",
            tombId,
            memberId: this.member.id,
            actionType: RecordActionType.VISITED,
            remark: null,
            checkInLng: position?.lng ?? null,
            checkInLat: position?.lat ?? null,
            checkInAccuracy: position?.accuracy ?? null,
            distanceMeters: checkResult?.distanceMeters ?? null,
            worshipTime: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          const detail = (await this.fetchTombDetail(tombId)) ?? { tomb, messages: [], records: [], photos: [] };
          this.tombDetails[tombId] = {
            ...detail,
            records: [record, ...detail.records],
          };
        }
        return;
      }

      if (!position) {
        throw new Error("标记已拜前需要先获取当前位置");
      }

      const createdRecord = await httpRequest<WorshipRecord>("worship-records", {
        method: "POST",
        body: JSON.stringify({
          taskId: this.activeTask.id,
          tombId,
          memberId: this.member.id,
          actionType: "visited",
          worshipTime: new Date().toISOString(),
          checkInLng: position.lng,
          checkInLat: position.lat,
          checkInAccuracy: position.accuracy ?? null,
        }),
      });

      if (!this.visitedTombIds.includes(tombId)) {
        this.visitedTombIds.push(tombId);
      }

      this.taskProgress = await httpRequest<TaskProgress>(`worship-tasks/${this.activeTask.id}/progress`);
      this.visitedTombIds = this.taskProgress.items.filter((item) => item.visited).map((item) => item.tomb.id);

      const detail = await this.fetchTombDetail(tombId, true);
      if (detail) {
        this.tombDetails[tombId] = {
          ...detail,
          records: [createdRecord, ...detail.records.filter((item) => item.id !== createdRecord.id)],
        };
      }
    },

    async addMessage(tombId: string, content: string) {
      const optimisticMessage: MemorialMessage = {
        id: `message-${Date.now()}`,
        familyId: this.family.id,
        tombId,
        memberId: this.member.id,
        content,
        status: MessageStatus.PENDING,
        createdAt: new Date().toISOString(),
      };

      this.messages.unshift(optimisticMessage);

      const currentDetail = this.tombDetails[tombId];
      if (currentDetail) {
        this.tombDetails[tombId] = {
          ...currentDetail,
          messages: [optimisticMessage, ...currentDetail.messages],
        };
      }

      if (this.source !== "api") {
        return optimisticMessage;
      }

      const created = await httpRequest<MemorialMessage>("memorial-messages", {
        method: "POST",
        body: JSON.stringify({
          familyId: this.family.id,
          tombId,
          memberId: this.member.id,
          content,
        }),
      });

      this.messages = [created, ...this.messages.filter((item) => item.id !== optimisticMessage.id)];

      const detail = this.tombDetails[tombId];
      if (detail) {
        this.tombDetails[tombId] = {
          ...detail,
          messages: [created, ...detail.messages.filter((item) => item.id !== optimisticMessage.id)],
        };
      }

      return created;
    },

    async updatePointLocation(tombId: string, payload: LocationPayload) {
      if (this.source !== "api") {
        const nextPoint = this.tombs.find((item) => item.id === tombId);
        if (!nextPoint) {
          throw new Error("点位不存在");
        }

        const updated = {
          ...nextPoint,
          lng: payload.lng,
          lat: payload.lat,
          updatedAt: new Date().toISOString(),
        };
        this.tombs = this.tombs.map((item) => (item.id === tombId ? updated : item));
        const detail = this.tombDetails[tombId];
        if (detail) {
          this.tombDetails[tombId] = {
            ...detail,
            tomb: updated,
          };
        }
        return updated;
      }

      const updated = await httpRequest<TombPoint>(`tombs/${tombId}`, {
        method: "PATCH",
        body: JSON.stringify({
          lng: payload.lng,
          lat: payload.lat,
        }),
      });

      this.tombs = this.tombs.map((item) => (item.id === tombId ? updated : item));

      const detail = this.tombDetails[tombId];
      if (detail) {
        this.tombDetails[tombId] = {
          ...detail,
          tomb: updated,
        };
      }

      return updated;
    },

    async uploadPointPhoto(tombId: string, file: File, caption?: string) {
      if (this.source !== "api") {
        const photo: TombPhoto = {
          id: `photo-${Date.now()}`,
          tombId,
          memberId: this.member.id,
          imageUrl: URL.createObjectURL(file),
          caption: caption?.trim() || null,
          createdAt: new Date().toISOString(),
        };
        const detail = await this.fetchTombDetail(tombId);
        if (detail) {
          this.tombDetails[tombId] = {
            ...detail,
            photos: [photo, ...detail.photos],
          };
        }
        return photo;
      }

      const uploaded = await uploadImage(file);

      const photo = await httpRequest<TombPhoto>(`tombs/${tombId}/photos`, {
        method: "POST",
        body: JSON.stringify({
          memberId: this.member.id,
          imageUrl: uploaded.url,
          caption: caption?.trim() || undefined,
        }),
      });

      const detail = await this.fetchTombDetail(tombId, true);
      if (detail) {
        this.tombDetails[tombId] = {
          ...detail,
          photos: [photo, ...detail.photos.filter((item) => item.id !== photo.id)],
        };
      }
      return photo;
    },

    async previewRoute(tombIds: string[]) {
      if (tombIds.length === 0) {
        this.routePreview = null;
        return null;
      }

      if (this.source !== "api") {
        this.routePreview = {
          familyId: this.family.id,
          orderedTombIds: tombIds,
          stops: tombIds
            .map((id) => this.tombs.find((item) => item.id === id))
            .filter((item): item is TombPoint => Boolean(item))
            .map((tomb, index) => ({
              order: index + 1,
              tomb,
              distanceFromPrevious: index === 0 ? 0 : 680 * index,
            })),
          totalDistanceMeters: tombIds.length * 680,
          estimatedDurationMinutes: tombIds.length * 8,
        };
        return this.routePreview;
      }

      this.routePreview = await httpRequest<RoutePreview>("route-plans/preview", {
        method: "POST",
        body: JSON.stringify({
          familyId: this.family.id,
          tombIds,
        }),
      });

      return this.routePreview;
    },

    async savePrimaryRoutePlan(payload: {
      name: string;
      description?: string | null;
      tombIds: string[];
      morningTombCount: number;
      afternoonTombCount: number;
    }) {
      const normalizedPayload = {
        familyId: this.family.id,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        tombIds: payload.tombIds,
        morningTombCount: payload.morningTombCount,
        afternoonTombCount: payload.afternoonTombCount,
        isPrimary: true,
        createdByMemberId: this.member.id,
      };

      if (this.source !== "api") {
        const existing = this.routes.find((item) => item.isPrimary) ?? this.routes[0] ?? null;
        const planRevision = existing
          ? existing.planRevision + (JSON.stringify(existing.tombIds) !== JSON.stringify(payload.tombIds) ||
              existing.morningTombCount !== payload.morningTombCount ||
              existing.afternoonTombCount !== payload.afternoonTombCount
              ? 1
              : 0)
          : 1;
        const nextRoute = {
          id: existing?.id ?? `route-${Date.now()}`,
          familyId: this.family.id,
          name: normalizedPayload.name,
          description: normalizedPayload.description,
          tombIds: [...payload.tombIds],
          isPrimary: true,
          morningTombCount: payload.morningTombCount,
          afternoonTombCount: payload.afternoonTombCount,
          planRevision,
          planUpdatedAt: new Date().toISOString(),
          createdByMemberId: this.member.id,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.routes = [nextRoute, ...this.routes.filter((item) => item.id !== nextRoute.id).map((item) => ({ ...item, isPrimary: false }))];
        return nextRoute;
      }

      const existing = this.routes.find((item) => item.isPrimary) ?? null;
      const route = existing
        ? await httpRequest<RoutePlan>(`route-plans/${existing.id}`, {
            method: "PATCH",
            body: JSON.stringify(normalizedPayload),
          })
        : await httpRequest<RoutePlan>("route-plans", {
            method: "POST",
            body: JSON.stringify(normalizedPayload),
          });

      const routes = await httpRequest<RoutePlan[]>(`route-plans?familyId=${this.family.id}`);
      this.routes = routes;
      return route;
    },

    async fetchActiveLocationShare() {
      if (!this.family.id) {
        this.activeLocationShare = null;
        return null;
      }

      if (this.source !== "api") {
        return this.activeLocationShare;
      }

      const session = await httpRequest<LocationShareSession | null>(
        `location-share-sessions/active?familyId=${this.family.id}`,
      );
      this.activeLocationShare = session;
      return session;
    },

    async startLocationShare(position: LocationPayload, title?: string) {
      if (this.source !== "api") {
        this.activeLocationShare = buildMockLocationShare(this.member);
        return this.activeLocationShare;
      }

      const session = await httpRequest<LocationShareSession>("location-share-sessions/start", {
        method: "POST",
        body: JSON.stringify({
          familyId: this.family.id,
          memberId: this.member.id,
          title,
          ...position,
        }),
      });
      this.activeLocationShare = session;
      return session;
    },

    async joinLocationShare(sessionId: string, position: LocationPayload) {
      if (this.source !== "api") {
        if (!this.activeLocationShare) {
          this.activeLocationShare = buildMockLocationShare(this.member);
        }
        return this.activeLocationShare;
      }

      const session = await httpRequest<LocationShareSession>(`location-share-sessions/${sessionId}/join`, {
        method: "POST",
        body: JSON.stringify({
          memberId: this.member.id,
          ...position,
        }),
      });
      this.activeLocationShare = session;
      return session;
    },

    async heartbeatLocationShare(sessionId: string, position: LocationPayload) {
      if (this.source !== "api") {
        if (!this.activeLocationShare) {
          this.activeLocationShare = buildMockLocationShare(this.member);
        }
        return this.activeLocationShare;
      }

      const session = await httpRequest<LocationShareSession>(`location-share-sessions/${sessionId}/heartbeat`, {
        method: "POST",
        body: JSON.stringify({
          memberId: this.member.id,
          ...position,
        }),
      });
      this.activeLocationShare = session;
      return session;
    },

    async leaveLocationShare(sessionId: string) {
      if (this.source !== "api") {
        this.activeLocationShare = null;
        return null;
      }

      const session = await httpRequest<LocationShareSession>(`location-share-sessions/${sessionId}/leave`, {
        method: "PATCH",
        body: JSON.stringify({
          memberId: this.member.id,
        }),
      });
      this.activeLocationShare = session;
      return session;
    },

    async closeLocationShare(sessionId: string) {
      if (this.source !== "api") {
        this.activeLocationShare = null;
        return null;
      }

      const session = await httpRequest<LocationShareSession>(`location-share-sessions/${sessionId}/close`, {
        method: "PATCH",
      });
      this.activeLocationShare = session.status === LocationShareSessionStatus.CLOSED ? null : session;
      return session;
    },
  },
});
