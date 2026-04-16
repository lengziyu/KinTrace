import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { MemberQuickLoginDto } from './dto/member-quick-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const matched = await compare(dto.password, user.passwordHash);

    if (!matched) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      tokenType: 'admin',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async memberQuickLogin(dto: MemberQuickLoginDto) {
    const familyFilters: Array<{ code?: string; inviteCode?: string }> = [];

    if (dto.familyCode) {
      familyFilters.push({ code: dto.familyCode });
    }

    if (dto.inviteCode) {
      familyFilters.push({ inviteCode: dto.inviteCode });
    }

    const family = await this.prisma.familyGroup.findFirst({
      where: {
        OR: familyFilters,
      },
    });

    if (!family) {
      throw new UnauthorizedException('未找到对应家族，请检查邀请链接');
    }

    const member =
      (await this.prisma.familyMember.findFirst({
        where: {
          familyId: family.id,
          nickname: dto.nickname,
        },
      })) ??
      (await this.prisma.familyMember.create({
        data: {
          familyId: family.id,
          nickname: dto.nickname,
          joinSource: dto.inviteCode ? 'invite' : 'quick-login',
        },
      }));

    const accessToken = await this.jwtService.signAsync({
      sub: member.id,
      familyId: family.id,
      role: member.role,
      tokenType: 'member',
    });

    return {
      accessToken,
      family,
      member,
    };
  }
}
