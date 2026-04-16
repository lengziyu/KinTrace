import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HeartbeatLocationShareDto } from './dto/heartbeat-location-share.dto';
import { LeaveLocationShareDto } from './dto/leave-location-share.dto';
import { StartLocationShareDto } from './dto/start-location-share.dto';

@Injectable()
export class LocationShareService {
  constructor(private readonly prisma: PrismaService) {}

  private staleThresholdMs = 90 * 1000;

  private serializeSession(
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

    const staleThreshold = Date.now() - this.staleThresholdMs;

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

  private async findSessionOrThrow(sessionId: string) {
    const session = await this.prisma.locationShareSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
        },
      },
    });

    if (!session) {
      throw new NotFoundException('未找到位置共享会话');
    }

    return session;
  }

  getActiveSession(familyId: string) {
    return this.prisma.locationShareSession
      .findFirst({
        where: {
          familyId,
          status: 'active',
        },
        include: {
          participants: {
            orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      .then((session) => this.serializeSession(session));
  }

  async start(dto: StartLocationShareDto) {
    const activeSession = await this.prisma.locationShareSession.findFirst({
      where: {
        familyId: dto.familyId,
        status: 'active',
      },
      include: {
        participants: {
          orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSession) {
      return this.join(activeSession.id, dto);
    }

    const member = await this.prisma.familyMember.findUnique({
      where: { id: dto.memberId },
    });

    if (!member) {
      throw new NotFoundException('未找到共享成员');
    }

    const created = await this.prisma.locationShareSession.create({
      data: {
        familyId: dto.familyId,
        title: dto.title,
        status: 'active',
        startedByMemberId: dto.memberId,
        participants: {
          create: {
            memberId: dto.memberId,
            nicknameSnapshot: member.nickname,
            lng: dto.lng,
            lat: dto.lat,
            accuracy: dto.accuracy,
            isOnline: true,
            lastActiveAt: new Date(),
          },
        },
      },
      include: {
        participants: {
          orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
        },
      },
    });

    return this.serializeSession(created);
  }

  async join(
    sessionId: string,
    dto: StartLocationShareDto | HeartbeatLocationShareDto,
  ) {
    const session = await this.findSessionOrThrow(sessionId);

    const member = await this.prisma.familyMember.findUnique({
      where: { id: dto.memberId },
    });

    if (!member) {
      throw new NotFoundException('未找到共享成员');
    }

    const updated = await this.prisma.locationShareSession.update({
      where: { id: session.id },
      data: {
        participants: {
          upsert: {
            where: {
              sessionId_memberId: {
                sessionId: session.id,
                memberId: dto.memberId,
              },
            },
            update: {
              nicknameSnapshot: member.nickname,
              lng: dto.lng,
              lat: dto.lat,
              accuracy: dto.accuracy,
              isOnline: true,
              lastActiveAt: new Date(),
            },
            create: {
              memberId: dto.memberId,
              nicknameSnapshot: member.nickname,
              lng: dto.lng,
              lat: dto.lat,
              accuracy: dto.accuracy,
              isOnline: true,
              lastActiveAt: new Date(),
            },
          },
        },
      },
      include: {
        participants: {
          orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
        },
      },
    });

    return this.serializeSession(updated);
  }

  heartbeat(sessionId: string, dto: HeartbeatLocationShareDto) {
    return this.join(sessionId, dto);
  }

  async leave(sessionId: string, dto: LeaveLocationShareDto) {
    await this.findSessionOrThrow(sessionId);

    const updated = await this.prisma.locationShareSession.update({
      where: { id: sessionId },
      data: {
        participants: {
          updateMany: {
            where: {
              memberId: dto.memberId,
            },
            data: {
              isOnline: false,
            },
          },
        },
      },
      include: {
        participants: {
          orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
        },
      },
    });

    return this.serializeSession(updated);
  }

  async close(sessionId: string) {
    await this.findSessionOrThrow(sessionId);

    const updated = await this.prisma.locationShareSession.update({
      where: { id: sessionId },
      data: {
        status: 'closed',
        endedAt: new Date(),
        participants: {
          updateMany: {
            where: {},
            data: {
              isOnline: false,
            },
          },
        },
      },
      include: {
        participants: {
          orderBy: [{ isOnline: 'desc' }, { updatedAt: 'desc' }],
        },
      },
    });

    return this.serializeSession(updated);
  }
}
