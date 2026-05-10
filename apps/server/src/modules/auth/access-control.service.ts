import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from './request-user.interface';

type FamilyMemberRole = 'admin' | 'manager' | 'member';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  requireUser(user?: RequestUser): RequestUser {
    if (!user) {
      throw new UnauthorizedException('请先登录后再继续操作');
    }

    return user;
  }

  requireAdmin(user?: RequestUser) {
    const currentUser = this.requireUser(user);
    if (currentUser.tokenType !== 'admin') {
      throw new ForbiddenException('当前接口仅允许后台管理员访问');
    }

    return currentUser;
  }

  requireMember(user?: RequestUser) {
    const currentUser = this.requireUser(user);
    if (currentUser.tokenType !== 'member') {
      throw new ForbiddenException('当前接口仅允许家族成员访问');
    }

    return currentUser;
  }

  async getAdminFamilyIds(user?: RequestUser) {
    const currentUser = this.requireAdmin(user);

    if (currentUser.role === 'super_admin') {
      return null;
    }

    if (currentUser.familyId) {
      return [currentUser.familyId];
    }

    const families = await this.prisma.familyGroup.findMany({
      where: {
        ownerUserId: currentUser.sub,
      },
      select: {
        id: true,
      },
    });

    return families.map((item) => item.id);
  }

  async assertAdminFamilyAccess(user: RequestUser | undefined, familyId: string) {
    const currentUser = this.requireAdmin(user);

    if (currentUser.role === 'super_admin') {
      return;
    }

    if (currentUser.familyId && currentUser.familyId === familyId) {
      return;
    }

    const family = await this.prisma.familyGroup.findFirst({
      where: {
        id: familyId,
        ownerUserId: currentUser.sub,
      },
      select: {
        id: true,
      },
    });

    if (!family) {
      throw new ForbiddenException('当前管理员无权访问该家族空间');
    }
  }

  assertMemberFamilyAccess(user: RequestUser | undefined, familyId: string) {
    const currentUser = this.requireMember(user);
    if (!currentUser.familyId || currentUser.familyId !== familyId) {
      throw new ForbiddenException('当前成员无权访问其他家族空间');
    }
  }

  assertMemberSelf(user: RequestUser | undefined, memberId: string) {
    const currentUser = this.requireMember(user);
    if (currentUser.sub !== memberId) {
      throw new ForbiddenException('当前成员仅允许操作自己的成员身份');
    }
  }

  async assertMemberRole(
    user: RequestUser | undefined,
    allowedRoles: FamilyMemberRole[],
  ) {
    const currentUser = this.requireMember(user);

    const member = await this.prisma.familyMember.findUnique({
      where: { id: currentUser.sub },
      select: {
        id: true,
        familyId: true,
        role: true,
      },
    });

    if (!member || member.familyId !== currentUser.familyId) {
      throw new ForbiddenException('当前成员状态异常，请重新登录后重试');
    }

    if (!allowedRoles.includes(member.role as FamilyMemberRole)) {
      throw new ForbiddenException('当前成员没有足够权限执行该操作');
    }

    return member;
  }

  async assertCanManageFamilyAsMember(
    user: RequestUser | undefined,
    familyId: string,
  ) {
    this.assertMemberFamilyAccess(user, familyId);
    return this.assertMemberRole(user, ['admin', 'manager']);
  }

  async assertCanAccessFamily(user: RequestUser | undefined, familyId: string) {
    const currentUser = this.requireUser(user);

    if (currentUser.tokenType === 'admin') {
      await this.assertAdminFamilyAccess(currentUser, familyId);
      return;
    }

    this.assertMemberFamilyAccess(currentUser, familyId);
  }
}
