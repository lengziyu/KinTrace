import { Injectable } from '@nestjs/common';
import { GenealogyGender, GenealogyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenealogyPersonDto } from './dto/create-genealogy-person.dto';
import { UpdateGenealogyPersonDto } from './dto/update-genealogy-person.dto';

type GenealogyPersonRecord = {
  id: string;
  familyId: string;
  name: string;
  gender: GenealogyGender;
  generationLevel: number;
  generationLabel: string;
  branchName: string | null;
  parentId: string | null;
  spouseName: string | null;
  status: GenealogyStatus;
  bio: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class GenealogyService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFamilyId(familyId?: string, familyCode?: string) {
    if (familyId?.trim()) {
      return familyId.trim();
    }

    if (!familyCode?.trim()) {
      return null;
    }

    const family = await this.prisma.familyGroup.findFirst({
      where: {
        code: familyCode.trim(),
      },
      select: {
        id: true,
      },
    });

    return family?.id ?? null;
  }

  findAll(familyId: string) {
    return this.prisma.genealogyPerson.findMany({
      where: {
        familyId,
      },
      orderBy: [
        { generationLevel: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  findOne(id: string) {
    return this.prisma.genealogyPerson.findUnique({
      where: { id },
    });
  }

  private buildChartData(people: GenealogyPersonRecord[]) {
    const sorted = [...people].sort((left, right) => {
      if (left.generationLevel !== right.generationLevel) {
        return left.generationLevel - right.generationLevel;
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });

    const childrenByParent = new Map<string, GenealogyPersonRecord[]>();
    const familyIdByPerson = new Map<string, string>();
    const familyIdByChild = new Map<string, string>();
    const familyMembers = new Map<
      string,
      {
        familyId: string;
        spouseId?: string;
        spouseName?: string | null;
        spouseGender: 'M' | 'F' | 'U';
      }
    >();

    for (const person of sorted) {
      if (!person.parentId) {
        continue;
      }

      const group = childrenByParent.get(person.parentId) ?? [];
      group.push(person);
      childrenByParent.set(person.parentId, group);
    }

    const fams = sorted
      .map((person) => {
        const children = childrenByParent.get(person.id) ?? [];
        const spouseName = person.spouseName?.trim();

        if (children.length === 0 && !spouseName) {
          return null;
        }

        const familyId = `gene-fam-${person.id}`;
        const spouseId = spouseName ? `gene-spouse-${person.id}` : undefined;
        familyIdByPerson.set(person.id, familyId);
        familyMembers.set(person.id, {
          familyId,
          spouseId,
          spouseName,
          spouseGender:
            person.gender === GenealogyGender.male
              ? 'F'
              : person.gender === GenealogyGender.female
                ? 'M'
                : 'U',
        });

        for (const child of children) {
          familyIdByChild.set(child.id, familyId);
        }

        if (person.gender === GenealogyGender.female) {
          return {
            id: familyId,
            wife: person.id,
            husb: spouseId,
            children: children.map((child) => child.id),
          };
        }

        return {
          id: familyId,
          husb: person.id,
          wife: spouseId,
          children: children.map((child) => child.id),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const indis = sorted.map((person) => ({
      id: person.id,
      firstName: person.name,
      lastName: [person.generationLabel, person.branchName].filter(Boolean).join(' · ') || undefined,
      famc: familyIdByChild.get(person.id),
      fams: familyIdByPerson.has(person.id)
        ? [familyIdByPerson.get(person.id)!]
        : undefined,
      sex:
        person.gender === GenealogyGender.male
          ? 'M'
          : person.gender === GenealogyGender.female
            ? 'F'
            : 'U',
      hideId: true,
      hideSex: person.gender === GenealogyGender.unknown,
    }));

    const spouseIndis = sorted
      .map((person) => {
        const familyMember = familyMembers.get(person.id);
        if (!familyMember?.spouseId || !familyMember.spouseName) {
          return null;
        }

        return {
          id: familyMember.spouseId,
          firstName: familyMember.spouseName,
          lastName: '配偶',
          fams: [familyMember.familyId],
          sex: familyMember.spouseGender,
          hideId: true,
          hideSex: familyMember.spouseGender === 'U',
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return {
      indis: [...indis, ...spouseIndis],
      fams,
    };
  }

  async getTreeView(filters: { familyId?: string; familyCode?: string }) {
    const familyId = await this.resolveFamilyId(filters.familyId, filters.familyCode);

    if (!familyId) {
      return null;
    }

    const people = await this.findAll(familyId);
    const startIndiId = people.find((item) => !item.parentId)?.id ?? people[0]?.id ?? null;

    return {
      familyId,
      people,
      chartData: this.buildChartData(people),
      startIndiId,
    };
  }

  create(dto: CreateGenealogyPersonDto) {
    return this.prisma.genealogyPerson.create({
      data: {
        familyId: dto.familyId,
        name: dto.name.trim(),
        gender: (dto.gender ?? GenealogyGender.unknown) as GenealogyGender,
        generationLevel: dto.generationLevel,
        generationLabel: dto.generationLabel.trim(),
        branchName: dto.branchName?.trim() || null,
        parentId: dto.parentId?.trim() || null,
        spouseName: dto.spouseName?.trim() || null,
        status: (dto.status ?? GenealogyStatus.living) as GenealogyStatus,
        bio: dto.bio?.trim() || null,
        sortOrder: dto.sortOrder ?? 1,
      },
    });
  }

  update(id: string, dto: UpdateGenealogyPersonDto) {
    return this.prisma.genealogyPerson.update({
      where: { id },
      data: {
        familyId: dto.familyId?.trim(),
        name: dto.name?.trim(),
        gender: dto.gender as GenealogyGender | undefined,
        generationLevel: dto.generationLevel,
        generationLabel: dto.generationLabel?.trim(),
        branchName:
          dto.branchName === undefined ? undefined : dto.branchName?.trim() || null,
        parentId:
          dto.parentId === undefined ? undefined : dto.parentId?.trim() || null,
        spouseName:
          dto.spouseName === undefined ? undefined : dto.spouseName?.trim() || null,
        status: dto.status as GenealogyStatus | undefined,
        bio: dto.bio === undefined ? undefined : dto.bio?.trim() || null,
        sortOrder: dto.sortOrder,
      },
    });
  }

  remove(id: string) {
    return this.prisma.genealogyPerson.delete({
      where: { id },
    });
  }
}
