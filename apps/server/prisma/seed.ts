import "dotenv/config";
import { hash } from "bcryptjs";
import {
  FamilyMemberRole,
  MessageStatus,
  PrismaClient,
  RecordActionType,
  TaskStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await hash("KinTrace123", 10);

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPassword,
      displayName: "宗迹管理员",
      role: UserRole.super_admin,
    },
  });

  const linFamily = await prisma.familyGroup.upsert({
    where: {
      code: "lin-family",
    },
    update: {
      ownerUserId: admin.id,
      upcomingWorshipAt: new Date("2026-04-15T08:30:00+08:00"),
      visitRangeMeters: 300,
    },
    create: {
      name: "林氏宗亲",
      code: "lin-family",
      description: "用于演示家族祭扫协作流程的示例家族。",
      inviteCode: "KINTRACE-LIN",
      ownerUserId: admin.id,
      upcomingWorshipAt: new Date("2026-04-15T08:30:00+08:00"),
      visitRangeMeters: 300,
    },
  });

  const chenFamily = await prisma.familyGroup.upsert({
    where: {
      code: "chen-family",
    },
    update: {
      ownerUserId: admin.id,
      upcomingWorshipAt: new Date("2026-04-18T17:30:00+08:00"),
      visitRangeMeters: 300,
    },
    create: {
      name: "陈氏家族",
      code: "chen-family",
      description: "用于演示超管多家族切换的第二个家族空间。",
      inviteCode: "KINTRACE-CHEN",
      ownerUserId: admin.id,
      upcomingWorshipAt: new Date("2026-04-18T17:30:00+08:00"),
      visitRangeMeters: 300,
    },
  });

  const linAdmin = await prisma.familyMember.upsert({
    where: {
      familyId_nickname: {
        familyId: linFamily.id,
        nickname: "林长安",
      },
    },
    update: {},
    create: {
      familyId: linFamily.id,
      nickname: "林长安",
      role: FamilyMemberRole.admin,
      joinSource: "seed",
    },
  });

  const linMember = await prisma.familyMember.upsert({
    where: {
      familyId_nickname: {
        familyId: linFamily.id,
        nickname: "林秋澄",
      },
    },
    update: {},
    create: {
      familyId: linFamily.id,
      nickname: "林秋澄",
      role: FamilyMemberRole.member,
      joinSource: "seed",
    },
  });

  const chenAdmin = await prisma.familyMember.upsert({
    where: {
      familyId_nickname: {
        familyId: chenFamily.id,
        nickname: "陈敬和",
      },
    },
    update: {},
    create: {
      familyId: chenFamily.id,
      nickname: "陈敬和",
      role: FamilyMemberRole.admin,
      joinSource: "seed",
    },
  });

  const linPointA = await prisma.tombPoint.upsert({
    where: {
      id: "seed-tomb-ancestor-a",
    },
    update: {},
    create: {
      id: "seed-tomb-ancestor-a",
      familyId: linFamily.id,
      name: "始祖林公纪念点",
      titleName: "始祖",
      generation: "一世",
      branchName: "宗脉主支",
      lng: 121.4737,
      lat: 31.2304,
      areaName: "松泽纪念园",
      description: "始祖核心祭扫点位，适合作为地图首页重点展示示例。",
      coverImage: "/uploads/seed/tomb-a.jpg",
    },
  });

  const linPointB = await prisma.tombPoint.upsert({
    where: {
      id: "seed-tomb-ancestor-b",
    },
    update: {},
    create: {
      id: "seed-tomb-ancestor-b",
      familyId: linFamily.id,
      name: "二房先人纪念点",
      titleName: "二房先人",
      generation: "三世",
      branchName: "东房",
      lng: 121.4837,
      lat: 31.2204,
      areaName: "东岭纪念区",
      description: "用于演示多点路线规划。",
      coverImage: "/uploads/seed/tomb-b.jpg",
    },
  });

  const chenPoint = await prisma.tombPoint.upsert({
    where: {
      id: "seed-tomb-chen-main",
    },
    update: {},
    create: {
      id: "seed-tomb-chen-main",
      familyId: chenFamily.id,
      name: "陈氏先贤纪念点",
      titleName: "先贤",
      generation: "二世",
      branchName: "南支",
      lng: 120.1652,
      lat: 30.2741,
      areaName: "南麓纪念区",
      description: "用于演示超管切换家族后的点位数据。",
      coverImage: null,
    },
  });

  const task = await prisma.worshipTask.upsert({
    where: {
      familyId_year: {
        familyId: linFamily.id,
        year: 2026,
      },
    },
    update: {},
    create: {
      familyId: linFamily.id,
      year: 2026,
      name: "2026 清明祭扫",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-20"),
      status: TaskStatus.active,
    },
  });

  const route = await prisma.routePlan.upsert({
    where: {
      id: "seed-route-main",
    },
    update: {},
    create: {
      id: "seed-route-main",
      familyId: linFamily.id,
      name: "清明主线",
      description: "从始祖点位到二房点位的示例路线。",
      tombIds: [linPointA.id, linPointB.id],
      createdByMemberId: linAdmin.id,
    },
  });

  await prisma.worshipRecord.upsert({
    where: {
      id: "seed-record-1",
    },
    update: {},
    create: {
      id: "seed-record-1",
      taskId: task.id,
      tombId: linPointA.id,
      memberId: linAdmin.id,
      actionType: RecordActionType.visited,
      remark: "已完成清扫与献花",
      checkInLng: 121.47375,
      checkInLat: 31.23043,
      checkInAccuracy: 15,
      distanceMeters: 8,
      worshipTime: new Date("2026-04-03T09:00:00+08:00"),
    },
  });

  await prisma.memorialMessage.upsert({
    where: {
      id: "seed-message-1",
    },
    update: {},
    create: {
      id: "seed-message-1",
      familyId: linFamily.id,
      tombId: linPointA.id,
      memberId: linMember.id,
      content: "愿家人平安顺遂，子孙和睦。",
      status: MessageStatus.approved,
    },
  });

  await prisma.memorialMessage.upsert({
    where: {
      id: "seed-message-2",
    },
    update: {},
    create: {
      id: "seed-message-2",
      familyId: linFamily.id,
      tombId: linPointB.id,
      memberId: linAdmin.id,
      content: "清明时节，谨表追思。",
      status: MessageStatus.pending,
    },
  });

  await prisma.tombPhoto.upsert({
    where: {
      id: "seed-photo-1",
    },
    update: {},
    create: {
      id: "seed-photo-1",
      tombId: linPointA.id,
      memberId: linAdmin.id,
      imageUrl: "/uploads/seed/tomb-a.jpg",
      caption: "清明前整理后的现场照片",
    },
  });

  console.log({
    adminUser: admin.username,
    adminPassword: "KinTrace123",
    families: [linFamily.code, chenFamily.code],
    inviteCodes: [linFamily.inviteCode, chenFamily.inviteCode],
    sampleRouteId: route.id,
    samplePointId: chenPoint.id,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
