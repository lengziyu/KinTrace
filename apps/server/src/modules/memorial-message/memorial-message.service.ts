import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemorialMessageDto } from './dto/create-memorial-message.dto';

@Injectable()
export class MemorialMessageService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(familyId?: string, tombId?: string, status?: string) {
    return this.prisma.memorialMessage.findMany({
      where: {
        familyId,
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

  create(dto: CreateMemorialMessageDto) {
    return this.prisma.memorialMessage.create({
      data: {
        familyId: dto.familyId,
        tombId: dto.tombId,
        memberId: dto.memberId,
        content: dto.content,
        status: (dto.status ?? 'pending') as never,
      },
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
