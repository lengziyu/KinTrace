import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(familyId?: string) {
    return this.prisma.familyMember.findMany({
      where: familyId
        ? {
            familyId,
          }
        : undefined,
      orderBy: {
        joinedAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.familyMember.findUnique({
      where: { id },
    });
  }

  create(dto: CreateMemberDto) {
    return this.prisma.familyMember.create({
      data: {
        familyId: dto.familyId,
        nickname: dto.nickname,
        phone: dto.phone,
        role: dto.role as never,
        status: dto.status as never,
      },
    });
  }

  update(id: string, dto: UpdateMemberDto) {
    return this.prisma.familyMember.update({
      where: { id },
      data: {
        ...dto,
        role: dto.role as never,
        status: dto.status as never,
      },
    });
  }

  remove(id: string) {
    return this.prisma.familyMember.delete({
      where: { id },
    });
  }
}
