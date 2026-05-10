import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private buildFamilyWhere(familyIds?: string[] | null) {
    if (familyIds === null || familyIds === undefined) {
      return undefined;
    }

    if (familyIds.length === 0) {
      return {
        familyId: {
          in: ['__no_family__'],
        },
      };
    }

    return {
      familyId: {
        in: familyIds,
      },
    };
  }

  private buildFamilyGroupWhere(familyIds?: string[] | null) {
    if (familyIds === null || familyIds === undefined) {
      return undefined;
    }

    if (familyIds.length === 0) {
      return {
        id: {
          in: ['__no_family__'],
        },
      };
    }

    return {
      id: {
        in: familyIds,
      },
    };
  }

  async getSummary(familyIds?: string[] | null) {
    const familyWhere = this.buildFamilyWhere(familyIds);
    const familyGroupWhere = this.buildFamilyGroupWhere(familyIds);

    const [families, members, tombs, tasks, pendingMessages, activeTasks] =
      await Promise.all([
        this.prisma.familyGroup.count({
          where: familyGroupWhere,
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

  async getAdminSnapshot(familyIds?: string[] | null) {
    const familyWhere = this.buildFamilyWhere(familyIds);
    const familyGroupWhere = this.buildFamilyGroupWhere(familyIds);

    const [summary, families, members, tombs, tasks, messages, routes] =
      await Promise.all([
        this.getSummary(familyIds),
        this.prisma.familyGroup.findMany({
          where: familyGroupWhere,
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
