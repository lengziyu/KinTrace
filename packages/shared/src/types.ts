import type {
  FamilyMemberRole,
  LocationShareSessionStatus,
  MemberStatus,
  MessageStatus,
  RecordActionType,
  TaskStatus,
  UserRole,
} from "./enums";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type PointMarkerPresetKey = "star" | "lotus" | "mountain" | "leaf";

export interface AppSettings {
  appNameZh: string;
  appNameEn: string;
  logoUrl: string;
  iconUrl: string;
  pointMarkerPreset: PointMarkerPresetKey;
  pointMarkerIconUrl: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  code: string;
  description: string | null;
  inviteCode: string;
  ownerUserId: string | null;
  upcomingWorshipAt: string | null;
  visitRangeMeters: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string | null;
  nickname: string;
  avatar: string | null;
  phone: string | null;
  role: FamilyMemberRole;
  joinSource: string;
  status: MemberStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TombPoint {
  id: string;
  familyId: string;
  name: string;
  titleName: string | null;
  generation: string | null;
  branchName: string | null;
  lng: number;
  lat: number;
  areaName: string | null;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TombPhoto {
  id: string;
  tombId: string;
  memberId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
}

export interface WorshipTask {
  id: string;
  familyId: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorshipRecord {
  id: string;
  taskId: string;
  tombId: string;
  memberId: string;
  actionType: RecordActionType;
  remark: string | null;
  checkInLng: number | null;
  checkInLat: number | null;
  checkInAccuracy: number | null;
  distanceMeters: number | null;
  worshipTime: string;
  createdAt: string;
}

export interface MemorialMessage {
  id: string;
  familyId: string;
  tombId: string;
  memberId: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
}

export interface RoutePlan {
  id: string;
  familyId: string;
  name: string;
  description: string | null;
  tombIds: string[];
  createdByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationShareParticipant {
  id: string;
  sessionId: string;
  memberId: string;
  nicknameSnapshot: string;
  lng: number;
  lat: number;
  accuracy: number | null;
  isOnline: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationShareSession {
  id: string;
  familyId: string;
  title: string | null;
  status: LocationShareSessionStatus;
  startedByMemberId: string;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  participants: LocationShareParticipant[];
}
