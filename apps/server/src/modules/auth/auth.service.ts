import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
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
    const phone = normalizePhone(dto.phone ?? '');
    const password = dto.password?.trim() ?? '';
    const superAdminPhone = normalizePhone(process.env.SUPER_ADMIN_PHONE ?? '');

    if (!phone || !password) {
      throw new UnauthorizedException('请输入手机号和密码');
    }

    const superAdmin = await this.prisma.user.findFirst({
      where: {
        username: phone,
        role: 'super_admin',
        status: 'active',
      },
    });

    if (superAdminPhone && phone === superAdminPhone) {
      if (!superAdmin) {
        throw new UnauthorizedException('超管账号未配置，请联系系统维护者');
      }

      const matched = await compare(password, superAdmin.passwordHash);
      if (!matched) {
        throw new UnauthorizedException('账号或密码错误');
      }

      return this.buildSuperAdminLoginResult(superAdmin);
    }

    if (superAdmin) {
      const matched = await compare(password, superAdmin.passwordHash);
      if (!matched) {
        throw new UnauthorizedException('账号或密码错误');
      }

      return this.buildSuperAdminLoginResult(superAdmin);
    }

    const member = await this.prisma.familyMember.findFirst({
      where: {
        phone,
        status: 'active',
      },
    });

    if (!member) {
      throw new UnauthorizedException('账号或密码错误');
    }

    if (!member.passwordHash) {
      throw new UnauthorizedException('当前账号尚未设置密码，请先通过邀请链接完成注册');
    }

    const matched = await compare(password, member.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('账号或密码错误');
    }

    if (!['admin', 'manager'].includes(member.role)) {
      throw new UnauthorizedException('当前成员不是管理员，不能登录后台管理');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: member.id,
      familyId: member.familyId,
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

  private async buildSuperAdminLoginResult(user: {
    id: string;
    username: string;
    displayName: string;
    role: string;
  }) {
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
    const phone = normalizePhone(dto.phone ?? '');
    const password = dto.password?.trim() ?? '';
    const trimmedNickname = dto.nickname?.trim();
    const familyFilters: Array<{ code?: string; inviteCode?: string }> = [];

    if (!phone || !password) {
      throw new UnauthorizedException('请输入手机号和密码');
    }

    if (dto.familyCode) {
      familyFilters.push({ code: dto.familyCode.trim() });
    }

    if (dto.inviteCode) {
      familyFilters.push({ inviteCode: dto.inviteCode.trim() });
    }

    if (familyFilters.length === 0) {
      const member = await this.prisma.familyMember.findFirst({
        where: {
          phone,
          status: 'active',
        },
      });

      if (!member?.passwordHash) {
        throw new UnauthorizedException('当前手机号未完成注册，请通过邀请链接加入家族');
      }

      const matched = await compare(password, member.passwordHash);
      if (!matched) {
        throw new UnauthorizedException('账号或密码错误');
      }

      const family = await this.prisma.familyGroup.findUnique({
        where: {
          id: member.familyId,
        },
      });

      if (!family) {
        throw new UnauthorizedException('当前账号关联家族不存在，请联系管理员处理');
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

    const family = await this.prisma.familyGroup.findFirst({
      where: {
        OR: familyFilters,
      },
    });

    if (!family) {
      throw new UnauthorizedException('未找到对应家族，请检查邀请链接');
    }

    let member = await this.prisma.familyMember.findFirst({
      where: {
        familyId: family.id,
        phone,
      },
    });

    if (!member) {
      const phoneOwner = await this.prisma.familyMember.findFirst({
        where: {
          phone,
        },
      });

      if (phoneOwner) {
        throw new UnauthorizedException('当前手机号已绑定其他家族，不能重复加入');
      }

      member = await this.prisma.familyMember.create({
        data: {
          familyId: family.id,
          phone,
          nickname: trimmedNickname || buildDefaultNickname(phone),
          passwordHash: await hash(password, 10),
          joinSource: dto.inviteCode ? 'invite' : 'quick-login',
        },
      });
    } else if (!member.passwordHash) {
      member = await this.prisma.familyMember.update({
        where: {
          id: member.id,
        },
        data: {
          passwordHash: await hash(password, 10),
          nickname: trimmedNickname || undefined,
        },
      });
    } else {
      const matched = await compare(password, member.passwordHash);
      if (!matched) {
        throw new UnauthorizedException('账号或密码错误');
      }

      if (trimmedNickname && member.nickname !== trimmedNickname) {
        member = await this.prisma.familyMember.update({
          where: { id: member.id },
          data: {
            nickname: trimmedNickname,
          },
        });
      }
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
