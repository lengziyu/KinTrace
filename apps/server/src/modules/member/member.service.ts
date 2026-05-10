import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(familyId?: string | string[]) {
    const where = Array.isArray(familyId)
      ? {
          familyId: {
            in: familyId,
          },
        }
      : familyId
        ? {
            familyId,
          }
        : undefined;

    return this.prisma.familyMember.findMany({
      where,
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

  updateProfile(id: string, dto: UpdateMyProfileDto) {
    return this.prisma.familyMember.update({
      where: { id },
      data: {
        nickname: dto.nickname?.trim() || undefined,
        avatar: dto.avatar?.trim() || undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.familyMember.delete({
      where: { id },
    });
  }
}
