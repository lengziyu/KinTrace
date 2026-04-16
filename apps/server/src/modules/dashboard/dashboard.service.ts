import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(familyId?: string) {
    const familyWhere = familyId ? { familyId } : undefined;

    const [families, members, tombs, tasks, pendingMessages, activeTasks] =
      await Promise.all([
        this.prisma.familyGroup.count({
          where: familyId ? { id: familyId } : undefined,
        }),
        this.prisma.familyMember.count({
          where: familyWhere,
        }),
        this.prisma.tombPoint.count({
          where: familyWhere,
        }),
        this.prisma.worshipTask.count({
          where: familyWhere,
        }),
        this.prisma.memorialMessage.count({
          where: {
            ...familyWhere,
            status: 'pending',
          },
        }),
        this.prisma.worshipTask.count({
          where: {
            ...familyWhere,
            status: 'active',
          },
        }),
      ]);

    return {
      families,
      members,
      tombs,
      tasks,
      pendingMessages,
      activeTasks,
    };
  }

  async getAdminSnapshot(familyId?: string) {
    const familyWhere = familyId ? { familyId } : undefined;

    const [summary, families, members, tombs, tasks, messages, routes] =
      await Promise.all([
        this.getSummary(familyId),
        this.prisma.familyGroup.findMany({
          orderBy: [{ upcomingWorshipAt: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.familyMember.findMany({
          where: familyWhere,
          orderBy: { joinedAt: 'desc' },
        }),
        this.prisma.tombPoint.findMany({
          where: familyWhere,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.worshipTask.findMany({
          where: familyWhere,
          orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        }),
        this.prisma.memorialMessage.findMany({
          where: familyWhere,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.routePlan.findMany({
          where: familyWhere,
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

    return {
      summary,
      families,
      members,
      tombs,
      tasks,
      messages,
      routes,
    };
  }
}
