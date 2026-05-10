import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { MemberQuickLoginDto } from './dto/member-quick-login.dto';

function normalizePhone(phone: string) {
  return phone.replace(/\D+/g, '');
}

function buildDefaultNickname(phone: string) {
  return `宗亲${phone.slice(-4)}`;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async adminLogin(dto: AdminLoginDto) {
    if (dto.phone?.trim()) {
      return this.adminMemberLogin(dto);
    }

    if (!dto.username?.trim() || !dto.password?.trim()) {
      throw new UnauthorizedException('请输入超管账号和密码');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username.trim(),
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

  private async adminMemberLogin(dto: AdminLoginDto) {
    const phone = normalizePhone(dto.phone ?? '');
    const familyFilters: Array<{ code?: string; inviteCode?: string }> = [];

    if (dto.familyCode?.trim()) {
      familyFilters.push({ code: dto.familyCode.trim() });
    }

    if (dto.inviteCode?.trim()) {
      familyFilters.push({ inviteCode: dto.inviteCode.trim() });
    }

    if (!phone || familyFilters.length === 0) {
      throw new UnauthorizedException('请输入手机号和家族邀请码后再登录后台');
    }

    const family = await this.prisma.familyGroup.findFirst({
      where: {
        OR: familyFilters,
      },
    });

    if (!family) {
      throw new UnauthorizedException('未找到对应家族，请检查邀请码或家族码');
    }

    const member = await this.prisma.familyMember.findFirst({
      where: {
        familyId: family.id,
        phone,
      },
    });

    if (!member) {
      throw new UnauthorizedException('当前手机号还不是该家族成员');
    }

    if (!['admin', 'manager'].includes(member.role)) {
      throw new UnauthorizedException('当前成员不是管理员，不能登录后台管理');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: member.id,
      familyId: family.id,
      role: 'family_admin',
      tokenType: 'admin',
    });

    return {
      accessToken,
      user: {
        id: member.id,
        username: member.phone ?? phone,
        displayName: member.nickname,
        role: 'family_admin',
      },
    };
  }

  async memberQuickLogin(dto: MemberQuickLoginDto) {
    const familyFilters: Array<{ code?: string; inviteCode?: string }> = [];

    if (dto.familyCode) {
      familyFilters.push({ code: dto.familyCode.trim() });
    }

    if (dto.inviteCode) {
      familyFilters.push({ inviteCode: dto.inviteCode.trim() });
    }

    if (familyFilters.length === 0) {
      throw new UnauthorizedException('请通过家族邀请链接进入后再登录');
    }

    const family = await this.prisma.familyGroup.findFirst({
      where: {
        OR: familyFilters,
      },
    });

    if (!family) {
      throw new UnauthorizedException('未找到对应家族，请检查邀请链接');
    }

    const normalizedPhone = normalizePhone(dto.phone);
    const trimmedNickname = dto.nickname?.trim();

    let member = await this.prisma.familyMember.findFirst({
      where: {
        familyId: family.id,
        phone: normalizedPhone,
      },
    });

    if (!member) {
      member = await this.prisma.familyMember.create({
        data: {
          familyId: family.id,
          phone: normalizedPhone,
          nickname: trimmedNickname || buildDefaultNickname(normalizedPhone),
          joinSource: dto.inviteCode ? 'invite' : 'quick-login',
        },
      });
    } else if (trimmedNickname && member.nickname !== trimmedNickname) {
      member = await this.prisma.familyMember.update({
        where: { id: member.id },
        data: {
          nickname: trimmedNickname,
        },
      });
    }

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
