import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutePlanDto } from './dto/create-route-plan.dto';
import { UpdateRoutePlanDto } from './dto/update-route-plan.dto';

@Injectable()
export class RoutePlanService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateDistanceMeters(
    start: { lng: number; lat: number },
    end: { lng: number; lat: number },
  ) {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRadians(end.lat - start.lat);
    const dLng = toRadians(end.lng - start.lng);
    const lat1 = toRadians(start.lat);
    const lat2 = toRadians(end.lat);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private normalizeTombIds(tombIds?: string[]) {
    return (tombIds ?? []).filter(Boolean);
  }

  private hasPlanChanged(
    current: {
      tombIds: unknown;
      morningTombCount: number;
      afternoonTombCount: number;
    },
    dto: UpdateRoutePlanDto,
  ) {
    const nextTombIds =
      dto.tombIds === undefined ? (current.tombIds as string[]) : this.normalizeTombIds(dto.tombIds);
    const currentTombIds = Array.isArray(current.tombIds) ? (current.tombIds as string[]) : [];

    return (
      JSON.stringify(currentTombIds) !== JSON.stringify(nextTombIds) ||
      (dto.morningTombCount !== undefined && dto.morningTombCount !== current.morningTombCount) ||
      (dto.afternoonTombCount !== undefined && dto.afternoonTombCount !== current.afternoonTombCount)
    );
  }

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

    return this.prisma.routePlan.findMany({
      where,
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.routePlan.findUnique({
      where: { id },
    });
  }

  async preview(familyId: string, tombIds: string[]) {
    const tombs = await this.prisma.tombPoint.findMany({
      where: {
        familyId,
        id: {
          in: tombIds,
        },
      },
    });

    const tombMap = new Map(tombs.map((item) => [item.id, item]));
    const orderedTombs = tombIds
      .map((id) => tombMap.get(id))
      .filter((item): item is (typeof tombs)[number] => Boolean(item));

    const stops = orderedTombs.map((tomb, index) => {
      const previous = orderedTombs[index - 1];
      const distanceFromPrevious = previous
        ? Math.round(
            this.calculateDistanceMeters(
              { lng: previous.lng, lat: previous.lat },
              { lng: tomb.lng, lat: tomb.lat },
            ),
          )
        : 0;

      return {
        order: index + 1,
        tomb,
        distanceFromPrevious,
      };
    });

    const totalDistanceMeters = stops.reduce(
      (sum, stop) => sum + stop.distanceFromPrevious,
      0,
    );

    return {
      familyId,
      orderedTombIds: orderedTombs.map((item) => item.id),
      stops,
      totalDistanceMeters,
      estimatedDurationMinutes: Math.max(
        Math.round(totalDistanceMeters / 240),
        orderedTombs.length === 0 ? 0 : orderedTombs.length * 8,
      ),
    };
  }

  async create(dto: CreateRoutePlanDto) {
    const normalizedTombIds = this.normalizeTombIds(dto.tombIds);
    const primaryRoute = await this.prisma.routePlan.findFirst({
      where: {
        familyId: dto.familyId,
        isPrimary: true,
      },
      select: {
        id: true,
      },
    });
    const shouldPrimary = dto.isPrimary ?? !primaryRoute;

    return this.prisma.$transaction(async (tx) => {
      if (shouldPrimary) {
        await tx.routePlan.updateMany({
          where: {
            familyId: dto.familyId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.routePlan.create({
        data: {
          familyId: dto.familyId,
          name: dto.name,
          description: dto.description,
          tombIds: normalizedTombIds,
          isPrimary: shouldPrimary,
          morningTombCount: dto.morningTombCount ?? 0,
          afternoonTombCount: dto.afternoonTombCount ?? 0,
          planRevision: normalizedTombIds.length > 0 ? 1 : 1,
          planUpdatedAt: normalizedTombIds.length > 0 ? new Date() : null,
          createdByMemberId: dto.createdByMemberId,
        },
      });
    });
  }

  async update(id: string, dto: UpdateRoutePlanDto) {
    const current = await this.prisma.routePlan.findUnique({
      where: { id },
      select: {
        id: true,
        familyId: true,
        tombIds: true,
        isPrimary: true,
        morningTombCount: true,
        afternoonTombCount: true,
        planRevision: true,
        planUpdatedAt: true,
      },
    });

    if (!current) {
      return null;
    }

    const normalizedTombIds =
      dto.tombIds === undefined ? undefined : this.normalizeTombIds(dto.tombIds);
    const planChanged = this.hasPlanChanged(current, {
      ...dto,
      tombIds: normalizedTombIds,
    });
    const shouldPrimary = dto.isPrimary ?? current.isPrimary;
    const nextRevision =
      planChanged && Array.isArray(current.tombIds) && current.tombIds.length > 0
        ? current.planRevision + 1
        : current.planRevision;

    return this.prisma.$transaction(async (tx) => {
      if (shouldPrimary) {
        await tx.routePlan.updateMany({
          where: {
            familyId: current.familyId,
            isPrimary: true,
            id: {
              not: id,
            },
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.routePlan.update({
        where: { id },
        data: {
          ...dto,
          tombIds: normalizedTombIds,
          isPrimary: shouldPrimary,
          planRevision: nextRevision,
          planUpdatedAt: planChanged ? new Date() : current.planUpdatedAt,
        },
      });
    });
  }

  remove(id: string) {
    return this.prisma.routePlan.delete({
      where: { id },
    });
  }
}
