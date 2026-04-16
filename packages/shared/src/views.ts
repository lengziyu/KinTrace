import type {
  FamilyGroup,
  FamilyMember,
  LocationShareSession,
  MemorialMessage,
  RoutePlan,
  TombPhoto,
  TombPoint,
  WorshipRecord,
  WorshipTask,
} from "./types";

export interface ProgressSummary {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface FamilyOverview {
  family: FamilyGroup;
  currentTask: WorshipTask | null;
  progress: ProgressSummary;
  tombs: TombPoint[];
  latestMessages: MemorialMessage[];
  routePlans: RoutePlan[];
  activeLocationShare: LocationShareSession | null;
}

export interface DashboardSummary {
  families: number;
  members: number;
  tombs: number;
  tasks: number;
  pendingMessages: number;
  activeTasks: number;
}

export interface TaskProgressItem {
  tomb: TombPoint;
  visited: boolean;
  latestRecord: WorshipRecord | null;
}

export interface TaskProgress {
  task: WorshipTask;
  summary: ProgressSummary;
  items: TaskProgressItem[];
}

export interface RoutePreviewStop {
  order: number;
  tomb: TombPoint;
  distanceFromPrevious: number;
}

export interface RoutePreview {
  familyId: string;
  orderedTombIds: string[];
  stops: RoutePreviewStop[];
  totalDistanceMeters: number;
  estimatedDurationMinutes: number;
}

export interface TombDetail {
  tomb: TombPoint;
  messages: MemorialMessage[];
  records: WorshipRecord[];
  photos: TombPhoto[];
}

export interface AdminSnapshot {
  summary: DashboardSummary;
  families: FamilyGroup[];
  members: FamilyMember[];
  tombs: TombPoint[];
  tasks: WorshipTask[];
  messages: MemorialMessage[];
  routes: RoutePlan[];
}
