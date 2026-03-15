import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PropertyStatus } from '@prisma/client';
import { CreateBuildingDto } from '../buildings/dto/create-building.dto/create-building.dto';
import { PrismaService } from '../database/prisma.service';
import { CreateUnitDto } from '../units/dto/create-unit.dto/create-unit.dto';
import { CreatePropertyDto } from './dto/create-property.dto/create-property.dto';
import {
  ListPropertiesDto,
  PropertySortBy,
  SortOrder,
} from './dto/list-properties.dto/list-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto/update-property.dto';

@Injectable()
export class PropertiesPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        ...dto,
        status: PropertyStatus.DRAFT,
        propertyNumber: dto.propertyNumber || `PROP-${Date.now()}`,
      },
      include: {
        manager: true,
        accountant: true,
      },
    });
  }

  async findAll(dto: ListPropertiesDto) {
    const sortBy = dto.sortBy ?? PropertySortBy.CREATED_AT;
    const sortOrder = dto.sortOrder ?? SortOrder.DESC;
    const search = dto.search?.trim();

    return this.prisma.property.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { propertyNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(dto.status && { status: dto.status }),
        ...(dto.source && { source: dto.source }),
        ...(dto.onlyWithUnits && { units: { some: { deletedAt: null } } }),
      },
      include: {
        _count: {
          select: {
            units: {
              where: { deletedAt: null },
            },
            buildings: true,
          },
        },
      },
      orderBy: this.buildOrderBy(sortBy, sortOrder),
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id, deletedAt: null },
      include: {
        buildings: {
          include: {
            _count: {
              select: {
                units: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: [{ label: 'asc' }, { createdAt: 'asc' }],
        },
        units: {
          where: { deletedAt: null },
          include: {
            building: {
              select: { id: true, label: true },
            },
          },
          orderBy: [{ building: { label: 'asc' } }, { number: 'asc' }],
        },
        sourceDocument: true,
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        aiExtractionJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            model: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
            confidenceScore: true,
            validationIssues: true,
            documentId: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    return property;
  }

  async update(id: string, data: UpdatePropertyDto) {
    await this.findOne(id); // throws 404 if missing
    return this.prisma.property.update({
      where: { id },
      data,
    });
  }

  async finalize(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { units: true },
    });

    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    if (property.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT properties can be finalized');
    }

    if (property.managementType === 'WEG') {
      if (!property.managerId) {
        throw new BadRequestException('WEG properties require a manager');
      }

      if (property.units.length === 0) {
        throw new BadRequestException('WEG properties require at least one unit');
      }

      const totalShare = property.units.reduce(
        (sum, unit) => sum + (unit.coOwnershipShare ?? 0),
        0,
      );

      if (Math.abs(totalShare - 1000) > 50) {
        throw new BadRequestException(
          `Invalid co-ownership share total: ${totalShare.toFixed(1)}‰ (expected ~1000‰, tolerance ±50)`,
        );
      }
    }

    return this.prisma.property.update({
      where: { id },
      data: { status: PropertyStatus.ACTIVE },
    });
  }

  async bulkCreateBuildings(propertyId: string, items: CreateBuildingDto[]) {
    const data = items.map((item) => ({
      ...item,
      propertyId,
      street: item.street ?? '',
      houseNumber: item.houseNumber ?? '',
      zipCode: item.zipCode ?? '',
      city: item.city ?? '',
    }));
    return this.prisma.building.createMany({ data });
  }

  async bulkCreateUnits(propertyId: string, items: CreateUnitDto[]) {
    const data = items.map((item) => ({
      ...item,
      propertyId,
    }));
    return this.prisma.unit.createMany({ data });
  }

  private buildOrderBy(
    sortBy: PropertySortBy,
    sortOrder: SortOrder,
  ): Prisma.PropertyOrderByWithRelationInput {
    if (sortBy === PropertySortBy.NAME) {
      return { name: sortOrder };
    }

    if (sortBy === PropertySortBy.UPDATED_AT) {
      return { updatedAt: sortOrder };
    }

    return { createdAt: sortOrder };
  }
}
