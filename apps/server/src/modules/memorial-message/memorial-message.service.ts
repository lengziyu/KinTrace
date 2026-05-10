import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemorialMessageDto } from './dto/create-memorial-message.dto';

@Injectable()
export class MemorialMessageService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(familyId?: string | string[], tombId?: string, status?: string) {
    const familyWhere = Array.isArray(familyId)
      ? {
          in: familyId,
        }
      : familyId;

    return this.prisma.memorialMessage.findMany({
      where: {
        familyId: familyWhere,
        tombId,
        status: status as never,
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

  findOne(id: string) {
    return this.prisma.memorialMessage.findUnique({
      where: { id },
    });
  }

  create(dto: CreateMemorialMessageDto) {
    return this.prisma.$transaction(async (prisma) => {
      const [member, tomb] = await Promise.all([
        prisma.familyMember.findUnique({
          where: { id: dto.memberId },
          select: {
            familyId: true,
          },
        }),
        prisma.tombPoint.findUnique({
          where: { id: dto.tombId },
          select: {
            familyId: true,
          },
        }),
      ]);

      if (!member || !tomb) {
        throw new BadRequestException('留言关联的成员或点位不存在');
      }

      if (
        member.familyId !== dto.familyId ||
        tomb.familyId !== dto.familyId ||
        member.familyId !== tomb.familyId
      ) {
        throw new BadRequestException('留言数据的家族归属不一致');
      }

      return prisma.memorialMessage.create({
        data: {
          familyId: dto.familyId,
          tombId: dto.tombId,
          memberId: dto.memberId,
          content: dto.content,
          status: (dto.status ?? 'pending') as never,
        },
      });
    });
  }

  review(id: string, status: string) {
    return this.prisma.memorialMessage.update({
      where: { id },
      data: {
        status: status as never,
      },
    });
  }
}
