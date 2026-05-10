import 'dotenv/config';
import { hash } from 'bcryptjs';
import {
  FamilyMemberRole,
  PrismaClient,
  TaskStatus,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

async function clearCurrentData() {
  await prisma.locationShareParticipant.deleteMany();
  await prisma.locationShareSession.deleteMany();
  await prisma.tombPhoto.deleteMany();
  await prisma.memorialMessage.deleteMany();
  await prisma.worshipRecord.deleteMany();
  await prisma.routePlan.deleteMany();
  await prisma.worshipTask.deleteMany();
  await prisma.tombPoint.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.familyGroup.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearCurrentData();

  const passwordHash = await hash('KinTrace123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      passwordHash,
      displayName: 'KinTrace 超级管理员',
      role: UserRole.super_admin,
    },
  });

  const chenFamily = await prisma.familyGroup.create({
    data: {
      name: '陈氏宗亲',
      code: 'chenshi',
      description: '陈氏家族祭扫协作空间，用于测试路线、地图和邀请流程。',
      inviteCode: 'chenshi_237',
      ownerUserId: null,
      upcomingWorshipAt: new Date('2026-04-18T08:30:00+08:00'),
      visitRangeMeters: 300,
    },
  });

  const linFamily = await prisma.familyGroup.create({
    data: {
      name: '林氏宗亲',
      code: 'linshi',
      description: '林氏家族祭扫协作空间，用于测试成员、位置共享和家族切换。',
      inviteCode: 'linshi_321',
      ownerUserId: null,
      upcomingWorshipAt: new Date('2026-04-20T08:30:00+08:00'),
      visitRangeMeters: 300,
    },
  });

  const chenMemberAdmin = await prisma.familyMember.create({
    data: {
      id: 'seed-member-chen-admin',
      familyId: chenFamily.id,
      nickname: '陈家管理员',
      phone: '13800001001',
      role: FamilyMemberRole.admin,
      joinSource: 'seed',
    },
  });

  await prisma.familyMember.create({
    data: {
      id: 'seed-member-chen-member',
      familyId: chenFamily.id,
      nickname: '陈家成员',
      phone: '13800001002',
      role: FamilyMemberRole.member,
      joinSource: 'seed',
    },
  });

  const linMemberAdmin = await prisma.familyMember.create({
    data: {
      id: 'seed-member-lin-admin',
      familyId: linFamily.id,
      nickname: '林家管理员',
      phone: '13800002001',
      role: FamilyMemberRole.admin,
      joinSource: 'seed',
    },
  });

  await prisma.familyMember.create({
    data: {
      id: 'seed-member-lin-member',
      familyId: linFamily.id,
      nickname: '林家成员',
      phone: '13800002002',
      role: FamilyMemberRole.member,
      joinSource: 'seed',
    },
  });

  const chenPointA = await prisma.tombPoint.create({
    data: {
      id: 'seed-tomb-chen-main',
      familyId: chenFamily.id,
      name: '陈氏祖墓',
      titleName: '始祖',
      generation: '一世',
      branchName: '主支',
      lng: 120.1652,
      lat: 30.2741,
      areaName: '南陵纪念区',
      description: '陈氏家族主祭扫点位。',
      coverImage: null,
    },
  });

  const chenPointB = await prisma.tombPoint.create({
    data: {
      id: 'seed-tomb-chen-east',
      familyId: chenFamily.id,
      name: '东房祖墓',
      titleName: '东房先人',
      generation: '三世',
      branchName: '东房',
      lng: 120.172,
      lat: 30.2681,
      areaName: '东坡纪念区',
      description: '用于测试路线排序和上午安排。',
      coverImage: null,
    },
  });

  const chenPointC = await prisma.tombPoint.create({
    data: {
      id: 'seed-tomb-chen-west',
      familyId: chenFamily.id,
      name: '西房纪念墓',
      titleName: '西房支系',
      generation: '五世',
      branchName: '西房',
      lng: 120.1586,
      lat: 30.2805,
      areaName: '西岭纪念区',
      description: '用于测试下午扫墓安排。',
      coverImage: null,
    },
  });

  const linPointA = await prisma.tombPoint.create({
    data: {
      id: 'seed-tomb-lin-main',
      familyId: linFamily.id,
      name: '林氏祖墓',
      titleName: '始祖',
      generation: '一世',
      branchName: '宗房主支',
      lng: 121.4737,
      lat: 31.2304,
      areaName: '松泽纪念园',
      description: '林氏家族主祭扫点位。',
      coverImage: null,
    },
  });

  const linPointB = await prisma.tombPoint.create({
    data: {
      id: 'seed-tomb-lin-north',
      familyId: linFamily.id,
      name: '北房纪念墓',
      titleName: '北房先人',
      generation: '四世',
      branchName: '北房',
      lng: 121.4812,
      lat: 31.2216,
      areaName: '北园纪念区',
      description: '用于测试第二个家族的线路与导航。',
      coverImage: null,
    },
  });

  await prisma.worshipTask.create({
    data: {
      familyId: chenFamily.id,
      year: 2026,
      name: '2026 清明祭扫',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-20'),
      status: TaskStatus.active,
    },
  });

  await prisma.worshipTask.create({
    data: {
      familyId: linFamily.id,
      year: 2026,
      name: '2026 春祭安排',
      startDate: new Date('2026-04-05'),
      endDate: new Date('2026-04-25'),
      status: TaskStatus.active,
    },
  });

  await prisma.routePlan.create({
    data: {
      id: 'seed-route-chen-main',
      familyId: chenFamily.id,
      name: '陈氏清明主线路',
      description: '上午先扫主支，下午依次走东房和西房。',
      tombIds: [chenPointA.id, chenPointB.id, chenPointC.id],
      createdByMemberId: chenMemberAdmin.id,
    },
  });

  await prisma.$executeRaw`
    UPDATE "RoutePlan"
    SET
      "isPrimary" = true,
      "morningTombCount" = 1,
      "afternoonTombCount" = 2,
      "planRevision" = 2,
      "planUpdatedAt" = ${new Date('2026-04-10T09:00:00+08:00')}
    WHERE id = ${'seed-route-chen-main'}
  `;

  await prisma.routePlan.create({
    data: {
      id: 'seed-route-lin-main',
      familyId: linFamily.id,
      name: '林氏春祭主线路',
      description: '上午扫祖墓，下午再去北房纪念墓。',
      tombIds: [linPointA.id, linPointB.id],
      createdByMemberId: linMemberAdmin.id,
    },
  });

  await prisma.$executeRaw`
    UPDATE "RoutePlan"
    SET
      "isPrimary" = true,
      "morningTombCount" = 1,
      "afternoonTombCount" = 1,
      "planRevision" = 1,
      "planUpdatedAt" = ${new Date('2026-04-08T09:30:00+08:00')}
    WHERE id = ${'seed-route-lin-main'}
  `;

  console.log({
    cleared: true,
    backendAccounts: {
      superAdmin: { username: 'superadmin', password: 'KinTrace123' },
    },
    h5AndAdminAccounts: {
      chenAdmin: { phone: '13800001001', inviteCode: 'chenshi_237', canLoginAdmin: true },
      chenMember: { phone: '13800001002', inviteCode: 'chenshi_237', canLoginAdmin: false },
      linAdmin: { phone: '13800002001', inviteCode: 'linshi_321', canLoginAdmin: true },
      linMember: { phone: '13800002002', inviteCode: 'linshi_321', canLoginAdmin: false },
    },
    families: [chenFamily.code, linFamily.code],
    seededBy: superAdmin.username,
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
