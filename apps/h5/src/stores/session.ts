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

const defaultAppSettings: AppSettings = {
  appNameZh: "宗迹",
  appNameEn: "KinTrace Admin",
  logoUrl: "",
  iconUrl: "/kintrace-logo.svg",
  pointMarkerPreset: "star",
  pointMarkerIconUrl: "",
};

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
    title: "清明同行共享",
    status: LocationShareSessionStatus.ACTIVE,
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
  }),
  getters: {
    activeTask(state) {
      return state.tasks[0] ?? null;
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
      this.error = message;
      this.family = mockFamily;
      this.member = mockMember;
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
    },

    async bootstrap() {
      if (this.loading) {
        return;
      }

      this.loading = true;
      this.error = "";

      try {
        const cachedFamilyId = localStorage.getItem(STORAGE_KEYS.familyId);
        let familyId = cachedFamilyId;

        if (!familyId) {
          const families = await httpRequest<FamilyGroup[]>("families");
          familyId = families.find((item) => item.code === mockFamily.code)?.id ?? families[0]?.id;
        }

        if (!familyId) {
          throw new Error("暂未查询到家族数据");
        }

        const [overview, tasks, messages, members, appSettings] = await Promise.all([
          httpRequest<FamilyOverview>(`families/${familyId}/overview`),
          httpRequest<WorshipTask[]>(`worship-tasks?familyId=${familyId}`),
          httpRequest<MemorialMessage[]>(`memorial-messages?familyId=${familyId}`),
          httpRequest<FamilyMember[]>(`members?familyId=${familyId}`),
          httpRequest<AppSettings>("app-settings"),
        ]);

        this.applyOverview(overview, tasks, messages);
        this.appSettings = {
          ...defaultAppSettings,
          ...appSettings,
        };
        this.source = "api";

        const cachedMemberId = localStorage.getItem(STORAGE_KEYS.memberId);
        this.member = members.find((item) => item.id === cachedMemberId) ?? members[0] ?? this.member;

        if (this.member?.id) {
          localStorage.setItem(STORAGE_KEYS.memberId, this.member.id);
        }

        if (this.activeTask) {
          this.taskProgress = await httpRequest<TaskProgress>(`worship-tasks/${this.activeTask.id}/progress`);
          this.visitedTombIds = this.taskProgress.items.filter((item) => item.visited).map((item) => item.tomb.id);
        }
      } catch (error) {
        this.useMockData(error instanceof Error ? error.message : "接口暂不可用，已回退到示例数据");
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    async quickLogin(nickname: string, inviteCode?: string, familyCode?: string) {
      const result = await httpRequest<{
        accessToken: string;
        family: FamilyGroup;
        member: FamilyMember;
      }>("auth/member/quick-login", {
        method: "POST",
        body: JSON.stringify({
          nickname,
          inviteCode,
          familyCode,
        }),
      });

      localStorage.setItem(STORAGE_KEYS.h5Token, result.accessToken);
      localStorage.setItem(STORAGE_KEYS.familyId, result.family.id);
      localStorage.setItem(STORAGE_KEYS.memberId, result.member.id);
      this.family = result.family;
      this.member = result.member;

      await this.bootstrap();
    },

    async fetchTombDetail(tombId: string, force = false) {
      if (!force && this.tombDetails[tombId]) {
        return this.tombDetails[tombId];
      }

      if (this.source !== "api") {
        const mockDetail = buildMockDetail(tombId, this.tombs, this.messages);
        if (mockDetail) {
          this.tombDetails[tombId] = mockDetail;
        }
        return mockDetail;
      }

      const detail = await httpRequest<TombDetail>(`tombs/${tombId}`);
      this.tombDetails[tombId] = detail;
      return detail;
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
