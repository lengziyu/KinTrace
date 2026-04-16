import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTombDto } from './dto/create-tomb.dto';
import { UpdateTombDto } from './dto/update-tomb.dto';

@Injectable()
export class TombService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(familyId?: string) {
    return this.prisma.tombPoint.findMany({
      where: familyId ? { familyId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const result = await this.prisma.tombPoint.findUnique({
      where: { id },
      include: {
        messages: {
          where: {
            status: 'approved',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        records: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        photos: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!result) {
      return null;
    }

    return {
      tomb: {
        id: result.id,
        familyId: result.familyId,
        name: result.name,
        titleName: result.titleName,
        generation: result.generation,
        branchName: result.branchName,
        lng: result.lng,
        lat: result.lat,
        areaName: result.areaName,
        description: result.description,
        coverImage: result.coverImage,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      messages: result.messages,
      records: result.records,
      photos: result.photos,
    };
  }

  create(dto: CreateTombDto) {
    return this.prisma.tombPoint.create({
      data: dto,
    });
  }

  update(id: string, dto: UpdateTombDto) {
    return this.prisma.tombPoint.update({
      where: { id },
      data: dto,
    });
  }

  async addPhoto(
    tombId: string,
    payload: {
      memberId: string;
      imageUrl: string;
      caption?: string;
    },
  ) {
    const tomb = await this.prisma.tombPoint.findUnique({
      where: { id: tombId },
    });

    if (!tomb) {
      throw new NotFoundException('点位不存在');
    }

    return this.prisma.tombPhoto.create({
      data: {
        tombId,
        memberId: payload.memberId,
        imageUrl: payload.imageUrl,
        caption: payload.caption?.trim() || null,
      },
    });
  }

  remove(id: string) {
    return this.prisma.tombPoint.delete({
      where: { id },
    });
  }
}
