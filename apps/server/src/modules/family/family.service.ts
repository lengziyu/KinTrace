import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  private toLocationShareSession(
    session: {
      id: string;
      familyId: string;
      title: string | null;
      status: 'active' | 'closed';
      startedByMemberId: string;
      createdAt: Date;
      updatedAt: Date;
      endedAt: Date | null;
      participants: Array<{
        id: string;
        sessionId: string;
        memberId: string;
        nicknameSnapshot: string;
        lng: number;
        lat: number;
        accuracy: number | null;
        isOnline: boolean;
        lastActiveAt: Date;
        createdAt: Date;
        updatedAt: Date;
      }>;
    } | null,
  ) {
    if (!session) {
      return null;
    }

    const staleThreshold = Date.now() - 90 * 1000;

    return {
      id: session.id,
      familyId: session.familyId,
      title: session.title,
      status: session.status,
      startedByMemberId: session.startedByMemberId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      endedAt: session.endedAt,
      participants: session.participants.map((participant) => ({
        ...participant,
        isOnline:
          participant.isOnline &&
          participant.lastActiveAt.getTime() >= staleThreshold,
      })),
    };
  }

  findAll() {
    return this.prisma.familyGroup.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            members: true,
            tombs: true,
            tasks: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.familyGroup.findUnique({
      where: { id },
      include: {
        members: true,
        tombs: true,
        tasks: true,
      },
    });
  }

  async getOverview(id: string) {
    const [
      family,
      currentTask,
      tombs,
      latestMessages,
      routePlans,
      activeLocationShare,
    ] = await Promise.all([
      this.prisma.familyGroup.findUnique({
        where: { id },
      }),
      this.prisma.worshipTask.findFirst({
        where: {
          familyId: id,
          status: 'active',
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.tombPoint.findMany({
        where: { familyId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.memorialMessage.findMany({
        where: {
          familyId: id,
          status: 'approved',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.routePlan.findMany({
        where: { familyId: id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.locationShareSession.findFirst({
        where: {
          familyId: id,
          status: 'active',
        },
        include: {
          participants: {
            orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!family) {
      return null;
    }

    const completed = currentTask
      ? await this.prisma.worshipRecord
          .groupBy({
            by: ['tombId'],
            where: {
              taskId: currentTask.id,
              actionType: 'visited',
            },
          })
          .then((items) => items.length)
      : 0;

    const total = tombs.length;
    const pending = Math.max(total - completed, 0);

    return {
      family,
      currentTask,
      progress: {
        total,
        completed,
        pending,
        completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
      },
      tombs,
      latestMessages,
      routePlans,
      activeLocationShare: this.toLocationShareSession(activeLocationShare),
    };
  }

  create(dto: CreateFamilyDto) {
    return this.prisma.familyGroup.create({
      data: {
        ...dto,
        upcomingWorshipAt: dto.upcomingWorshipAt
          ? new Date(dto.upcomingWorshipAt)
          : undefined,
        visitRangeMeters: dto.visitRangeMeters,
      },
    });
  }

  update(id: string, dto: UpdateFamilyDto) {
    return this.prisma.familyGroup.update({
      where: { id },
      data: {
        ...dto,
        upcomingWorshipAt:
          dto.upcomingWorshipAt === undefined
            ? undefined
            : dto.upcomingWorshipAt
              ? new Date(dto.upcomingWorshipAt)
              : null,
        visitRangeMeters: dto.visitRangeMeters,
      },
    });
  }
}
