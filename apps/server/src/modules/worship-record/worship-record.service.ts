import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorshipRecordDto } from './dto/create-worship-record.dto';

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(
  leftLat: number,
  leftLng: number,
  rightLat: number,
  rightLng: number,
) {
  const earthRadius = 6371000;
  const deltaLat = degreesToRadians(rightLat - leftLat);
  const deltaLng = degreesToRadians(rightLng - leftLng);
  const startLat = degreesToRadians(leftLat);
  const endLat = degreesToRadians(rightLat);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;

  return Math.round(
    2 *
      earthRadius *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

@Injectable()
export class WorshipRecordService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(taskId?: string, tombId?: string) {
    return this.prisma.worshipRecord.findMany({
      where: {
        taskId,
        tombId,
      },
      include: {
        member: true,
        tomb: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: CreateWorshipRecordDto) {
    let distanceMeters: number | null = null;

    if (dto.actionType === 'visited') {
      if (dto.checkInLng === undefined || dto.checkInLat === undefined) {
        throw new BadRequestException('标记已拜需要先获取当前位置');
      }

      const tomb = await this.prisma.tombPoint.findUnique({
        where: { id: dto.tombId },
        include: {
          family: true,
        },
      });

      if (!tomb) {
        throw new NotFoundException('点位不存在');
      }

      distanceMeters = calculateDistanceMeters(
        dto.checkInLat,
        dto.checkInLng,
        tomb.lat,
        tomb.lng,
      );

      if (distanceMeters > tomb.family.visitRangeMeters) {
        throw new BadRequestException(
          `当前位置距离点位 ${distanceMeters} 米，已超出允许范围 ${tomb.family.visitRangeMeters} 米`,
        );
      }
    }

    const [task, member, tombFamily] = await Promise.all([
      this.prisma.worshipTask.findUnique({
        where: { id: dto.taskId },
        select: {
          familyId: true,
        },
      }),
      this.prisma.familyMember.findUnique({
        where: { id: dto.memberId },
        select: {
          familyId: true,
        },
      }),
      this.prisma.tombPoint.findUnique({
        where: { id: dto.tombId },
        select: {
          familyId: true,
        },
      }),
    ]);

    if (!task || !member || !tombFamily) {
      throw new BadRequestException('祭扫记录关联的任务、成员或点位不存在');
    }

    if (
      task.familyId !== member.familyId ||
      task.familyId !== tombFamily.familyId
    ) {
      throw new BadRequestException('祭扫记录的家族归属不一致');
    }

    return this.prisma.worshipRecord.create({
      data: {
        taskId: dto.taskId,
        tombId: dto.tombId,
        memberId: dto.memberId,
        actionType: dto.actionType as never,
        remark: dto.remark,
        checkInLng: dto.checkInLng,
        checkInLat: dto.checkInLat,
        checkInAccuracy: dto.checkInAccuracy,
        distanceMeters,
        worshipTime: dto.worshipTime ? new Date(dto.worshipTime) : new Date(),
      },
    });
  }
}
