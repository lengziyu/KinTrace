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
  await prisma.genealogyPerson.deleteMany();
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

  const superAdminPassword = 'KinTrace123';
  const memberPassword = 'KinTrace123';
  const superAdminPhone = '13800000000';
  const superAdminPasswordHash = await hash(superAdminPassword, 10);
  const memberPasswordHash = await hash(memberPassword, 10);

  const superAdmin = await prisma.user.create({
    data: {
      username: superAdminPhone,
      passwordHash: superAdminPasswordHash,
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
      passwordHash: memberPasswordHash,
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
      passwordHash: memberPasswordHash,
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
      passwordHash: memberPasswordHash,
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
      passwordHash: memberPasswordHash,
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

  const chenRoot = await prisma.genealogyPerson.create({
    data: {
      familyId: chenFamily.id,
      name: '陈启源',
      gender: 'male',
      generationLevel: 1,
      generationLabel: '一世',
      branchName: '宗脉主支',
      spouseName: '王氏',
      status: 'deceased',
      bio: '陈氏入谱始祖，用于展示 Topola 风格族谱树。',
      sortOrder: 1,
    },
  });

  const chenSecond = await prisma.genealogyPerson.create({
    data: {
      familyId: chenFamily.id,
      name: '陈宗礼',
      gender: 'male',
      generationLevel: 2,
      generationLabel: '二世',
      branchName: '宗脉主支',
      parentId: chenRoot.id,
      spouseName: '周氏',
      status: 'deceased',
      bio: '承续主支香火，作为第二代人物示例。',
      sortOrder: 1,
    },
  });

  await prisma.genealogyPerson.create({
    data: {
      familyId: chenFamily.id,
      name: '陈明远',
      gender: 'male',
      generationLevel: 3,
      generationLabel: '三世',
      branchName: '东房',
      parentId: chenSecond.id,
      spouseName: null,
      status: 'living',
      bio: '当前在谱人物示例。',
      sortOrder: 1,
    },
  });

  const linRoot = await prisma.genealogyPerson.create({
    data: {
      familyId: linFamily.id,
      name: '林守正',
      gender: 'male',
      generationLevel: 1,
      generationLabel: '一世',
      branchName: '南支',
      spouseName: '吴氏',
      status: 'deceased',
      bio: '林氏家族根节点示例。',
      sortOrder: 1,
    },
  });

  await prisma.genealogyPerson.create({
    data: {
      familyId: linFamily.id,
      name: '林敬修',
      gender: 'male',
      generationLevel: 2,
      generationLabel: '二世',
      branchName: '南支',
      parentId: linRoot.id,
      spouseName: '赵氏',
      status: 'living',
      bio: '林氏第二代人物示例。',
      sortOrder: 1,
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
      superAdmin: { phone: superAdminPhone, password: superAdminPassword },
    },
    h5AndAdminAccounts: {
      chenAdmin: { phone: '13800001001', password: memberPassword, canLoginAdmin: true },
      chenMember: { phone: '13800001002', password: memberPassword, canLoginAdmin: false },
      linAdmin: { phone: '13800002001', password: memberPassword, canLoginAdmin: true },
      linMember: { phone: '13800002002', password: memberPassword, canLoginAdmin: false },
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
