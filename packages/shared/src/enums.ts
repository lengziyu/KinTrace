export enum UserRole {
  SUPER_ADMIN = "super_admin",
  FAMILY_ADMIN = "family_admin",
}

export enum FamilyMemberRole {
  ADMIN = "admin",
  MANAGER = "manager",
  MEMBER = "member",
}

export enum RecordActionType {
  VISITED = "visited",
  CLEANED = "cleaned",
  OFFERED = "offered",
  NOTE = "note",
}

export enum TaskStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  CLOSED = "closed",
}

export enum MessageStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum MemberStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum LocationShareSessionStatus {
  ACTIVE = "active",
  CLOSED = "closed",
}
