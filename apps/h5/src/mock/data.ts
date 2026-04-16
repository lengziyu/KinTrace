import type {
  FamilyGroup,
  FamilyMember,
  MemorialMessage,
  RoutePlan,
  TombPoint,
  WorshipTask,
} from "@kintrace/shared";
import { FamilyMemberRole, MemberStatus, MessageStatus, TaskStatus } from "@kintrace/shared";

export const mockFamily: FamilyGroup = {
  id: "family-lin",
  name: "林氏宗亲",
  code: "lin-family",
  description: "共护宗迹，协作祭扫。",
  inviteCode: "KINTRACE-LIN",
  ownerUserId: "admin-1",
  upcomingWorshipAt: "2026-04-15T08:30:00+08:00",
  visitRangeMeters: 300,
  createdAt: "2026-04-01T08:00:00.000Z",
  updatedAt: "2026-04-08T08:00:00.000Z",
};

export const mockMember: FamilyMember = {
  id: "member-1",
  familyId: "family-lin",
  userId: null,
  nickname: "林长宁",
  avatar: null,
  phone: null,
  role: FamilyMemberRole.ADMIN,
  joinSource: "invite",
  status: MemberStatus.ACTIVE,
  joinedAt: "2026-04-01T08:00:00.000Z",
  createdAt: "2026-04-01T08:00:00.000Z",
  updatedAt: "2026-04-08T08:00:00.000Z",
};

export const mockTombs: TombPoint[] = [
  {
    id: "tomb-1",
    familyId: "family-lin",
    name: "始祖林公纪念点",
    titleName: "始祖",
    generation: "一世",
    branchName: "宗脉主支",
    lng: 121.4737,
    lat: 31.2304,
    areaName: "松泽纪念园",
    description: "祭扫主点位，适合作为地图首页展示。",
    coverImage: null,
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-08T08:00:00.000Z",
  },
  {
    id: "tomb-2",
    familyId: "family-lin",
    name: "二房先人纪念点",
    titleName: "二房先人",
    generation: "三世",
    branchName: "东房",
    lng: 121.4837,
    lat: 31.2204,
    areaName: "东岗纪念区",
    description: "适合作为双点路线规划示例。",
    coverImage: null,
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-08T08:00:00.000Z",
  },
  {
    id: "tomb-3",
    familyId: "family-lin",
    name: "西山支系纪念点",
    titleName: "西山支系",
    generation: "五世",
    branchName: "西房",
    lng: 121.4937,
    lat: 31.2154,
    areaName: "西山纪念区",
    description: "用于演示多点路线排序。",
    coverImage: null,
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-08T08:00:00.000Z",
  },
];

export const mockTasks: WorshipTask[] = [
  {
    id: "task-2026",
    familyId: "family-lin",
    year: 2026,
    name: "2026 清明祭扫",
    startDate: "2026-04-01",
    endDate: "2026-04-20",
    status: TaskStatus.ACTIVE,
  },
];

export const mockMessages: MemorialMessage[] = [
  {
    id: "message-1",
    familyId: "family-lin",
    tombId: "tomb-1",
    memberId: "member-1",
    content: "愿先人安息，愿家族和睦绵长。",
    status: MessageStatus.APPROVED,
    createdAt: "2026-04-04T03:20:00.000Z",
  },
];

export const mockRoutes: RoutePlan[] = [
  {
    id: "route-1",
    familyId: "family-lin",
    name: "清明主线",
    description: "由主点位出发，串联东房与西山支系。",
    tombIds: ["tomb-1", "tomb-2", "tomb-3"],
    createdByMemberId: "member-1",
    createdAt: "2026-04-02T08:00:00.000Z",
    updatedAt: "2026-04-08T08:00:00.000Z",
  },
];
