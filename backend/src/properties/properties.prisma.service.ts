import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto/create-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto/list-properties.dto';
import { CreateBuildingDto } from '../buildings/dto/create-building.dto/create-building.dto';
import { CreateUnitDto } from '../units/dto/create-unit.dto/create-unit.dto';
import { PropertyStatus } from '@prisma/client';

@Injectable()
export class PropertiesPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(dto: CreatePropertyDto){
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
    return this.prisma.property.findMany({
      where: {
        deletedAt: null,
        ...(dto.search && {
          OR: [{name: { contains: dto.search}}, { propertyNumber: { contains: dto.search}}]
        }),
        ...(dto.status && { status: dto.status as PropertyStatus }),
      },
      include: {
        _count: {select: {units: true, buildings: true}},
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  async findOne(id: string){
    const property = await this.prisma.property.findUnique({
      where: { id , deletedAt: null},
      include: {
        buildings: { include: { _count: { select: { units: true } } } },
        units: true,
        sourceDocument: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    return property;
  }


  async update(id: string, data: Partial<CreatePropertyDto>) {
    await this.findOne(id); // throws 404 if missing
    return this.prisma.property.update({
      where: { id },
      data: data,
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
}
