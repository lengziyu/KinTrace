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

  findAll(familyId?: string) {
    return this.prisma.routePlan.findMany({
      where: familyId ? { familyId } : undefined,
      orderBy: {
        updatedAt: 'desc',
      },
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

  create(dto: CreateRoutePlanDto) {
    return this.prisma.routePlan.create({
      data: {
        familyId: dto.familyId,
        name: dto.name,
        description: dto.description,
        tombIds: dto.tombIds,
        createdByMemberId: dto.createdByMemberId,
      },
    });
  }

  update(id: string, dto: UpdateRoutePlanDto) {
    return this.prisma.routePlan.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.routePlan.delete({
      where: { id },
    });
  }
}
