import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildFamilyKeyBase, generateThreeDigitSuffix } from './family-key.util';
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

  private async generateUniqueCode(name: string, excludeId?: string) {
    const base = buildFamilyKeyBase(name);
    let candidate = base;
    let attempt = 0;

    while (attempt < 30) {
      const exists = await this.prisma.familyGroup.findFirst({
        where: {
          code: candidate,
          id: excludeId
            ? {
                not: excludeId,
              }
            : undefined,
        },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }

      candidate = `${base}-${generateThreeDigitSuffix()}`;
      attempt += 1;
    }

    return `${base}-${Date.now().toString().slice(-4)}`;
  }

  private async generateUniqueInviteCode(name: string, excludeId?: string) {
    const base = buildFamilyKeyBase(name);
    let attempt = 0;

    while (attempt < 50) {
      const candidate = `${base}_${generateThreeDigitSuffix()}`;
      const exists = await this.prisma.familyGroup.findFirst({
        where: {
          inviteCode: candidate,
          id: excludeId
            ? {
                not: excludeId,
              }
            : undefined,
        },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }

      attempt += 1;
    }

    return `${base}_${Date.now().toString().slice(-3)}`;
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

  resolveByAccess(familyCode?: string, inviteCode?: string) {
    const code = familyCode?.trim();
    const invite = inviteCode?.trim();
    const filters: Array<{ code?: string; inviteCode?: string }> = [];

    if (code) {
      filters.push({ code });
    }

    if (invite) {
      filters.push({ inviteCode: invite });
    }

    if (filters.length === 0) {
      return null;
    }

    return this.prisma.familyGroup.findFirst({
      where: {
        OR: filters,
      },
    });
  }

  async create(dto: CreateFamilyDto) {
    const name = dto.name.trim();
    const code = dto.code?.trim() || (await this.generateUniqueCode(name));
    const inviteCode =
      dto.inviteCode?.trim() || (await this.generateUniqueInviteCode(name));

    return this.prisma.familyGroup.create({
      data: {
        ...dto,
        name,
        code,
        inviteCode,
        upcomingWorshipAt: dto.upcomingWorshipAt
          ? new Date(dto.upcomingWorshipAt)
          : undefined,
        visitRangeMeters: dto.visitRangeMeters,
      },
    });
  }

  async update(id: string, dto: UpdateFamilyDto) {
    const currentFamily = await this.prisma.familyGroup.findUnique({
      where: { id },
      select: { name: true },
    });
    const nextName = dto.name?.trim() || currentFamily?.name || 'family';
    const nextCode =
      dto.code === undefined
        ? undefined
        : dto.code.trim() || (await this.generateUniqueCode(nextName, id));
    const nextInviteCode =
      dto.inviteCode === undefined
        ? undefined
        : dto.inviteCode.trim() ||
          (await this.generateUniqueInviteCode(nextName, id));

    return this.prisma.familyGroup.update({
      where: { id },
      data: {
        ...dto,
        name: dto.name?.trim(),
        code: nextCode,
        inviteCode: nextInviteCode,
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
