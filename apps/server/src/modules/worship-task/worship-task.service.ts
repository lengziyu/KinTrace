import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorshipTaskDto } from './dto/create-worship-task.dto';
import { UpdateWorshipTaskDto } from './dto/update-worship-task.dto';

@Injectable()
export class WorshipTaskService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(familyId?: string | string[]) {
    const where = Array.isArray(familyId)
      ? {
          familyId: {
            in: familyId,
          },
        }
      : familyId
        ? { familyId }
        : undefined;

    return this.prisma.worshipTask.findMany({
      where,
      include: {
        _count: {
          select: {
            records: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.worshipTask.findUnique({
      where: { id },
    });
  }

  async getProgress(id: string) {
    const task = await this.prisma.worshipTask.findUnique({
      where: { id },
    });

    if (!task) {
      return null;
    }

    const [tombs, records] = await Promise.all([
      this.prisma.tombPoint.findMany({
        where: { familyId: task.familyId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.worshipRecord.findMany({
        where: {
          taskId: id,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const latestRecordMap = new Map<string, (typeof records)[number]>();

    for (const record of records) {
      if (!latestRecordMap.has(record.tombId)) {
        latestRecordMap.set(record.tombId, record);
      }
    }

    const items = tombs.map((tomb) => {
      const latestRecord = latestRecordMap.get(tomb.id) ?? null;
      return {
        tomb,
        visited: latestRecord?.actionType === 'visited',
        latestRecord,
      };
    });

    const total = items.length;
    const completed = items.filter((item) => item.visited).length;
    const pending = Math.max(total - completed, 0);

    return {
      task,
      summary: {
        total,
        completed,
        pending,
        completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
      },
      items,
    };
  }

  create(dto: CreateWorshipTaskDto) {
    return this.prisma.worshipTask.create({
      data: {
        familyId: dto.familyId,
        year: dto.year,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: (dto.status ?? 'draft') as never,
      },
    });
  }

  update(id: string, dto: UpdateWorshipTaskDto) {
    return this.prisma.worshipTask.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status as never,
      },
    });
  }

  remove(id: string) {
    return this.prisma.worshipTask.delete({
      where: { id },
    });
  }
}
