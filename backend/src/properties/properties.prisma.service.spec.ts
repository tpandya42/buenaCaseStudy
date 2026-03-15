import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesPrismaService } from './properties.prisma.service';
import { PrismaService } from '../database/prisma.service';
import { createPrismaMock, PrismaMock } from '../test-utils/prisma-mock.factory';
import { mockProperty, mockUnit } from '../test-utils/fixtures';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PropertySource, PropertyStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  ListPropertiesDto,
  PropertySortBy,
  SortOrder,
} from './dto/list-properties.dto/list-properties.dto';

describe('PropertiesPrismaService', () => {
  let service: PropertiesPrismaService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesPrismaService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PropertiesPrismaService>(PropertiesPrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createDraft', () => {
    it('should create a property with DRAFT status', async () => {
      const dto = {
        name: 'Test',
        managementType: 'WEG' as any,
        organizationId: 'org-1',
      };
      const expected = mockProperty(dto);
      prisma.property.create.mockResolvedValue(expected);

      const result = await service.createDraft(dto);

      expect(prisma.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test',
            status: PropertyStatus.DRAFT,
          }),
        }),
      );
      expect(result).toEqual(expected);
    });

    it('should generate a propertyNumber if not provided', async () => {
      const dto = {
        name: 'Test',
        managementType: 'WEG' as any,
        organizationId: 'org-1',
      };
      prisma.property.create.mockResolvedValue(mockProperty());

      await service.createDraft(dto);

      const callData = prisma.property.create.mock.calls[0][0].data;
      expect(callData.propertyNumber).toMatch(/^PROP-\d+$/);
    });
  });

  describe('findAll', () => {
    it('should filter out deleted properties', async () => {
      prisma.property.findMany.mockResolvedValue([mockProperty()]);

      await service.findAll({});

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('should apply case-insensitive search filter when provided', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await service.findAll({ search: '  berlin  ' });

      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { name: { contains: 'berlin', mode: 'insensitive' } },
        { propertyNumber: { contains: 'berlin', mode: 'insensitive' } },
      ]);
    });

    it('should ignore blank search values', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await service.findAll({ search: '   ' });

      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeUndefined();
    });

    it('should filter by status when provided', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await service.findAll({ status: PropertyStatus.ACTIVE });

      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where.status).toBe(PropertyStatus.ACTIVE);
    });

    it('should filter by source when provided', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await service.findAll({ source: PropertySource.AI_ASSISTED });

      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where.source).toBe(PropertySource.AI_ASSISTED);
    });

    it('should filter to properties with units when onlyWithUnits is true', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await service.findAll({ onlyWithUnits: true });

      const where = prisma.property.findMany.mock.calls[0][0].where;
      expect(where.units).toEqual({ some: { deletedAt: null } });
    });

    it('should apply custom sort settings when provided', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await service.findAll({
        sortBy: PropertySortBy.NAME,
        sortOrder: SortOrder.ASC,
      });

      expect(prisma.property.findMany.mock.calls[0][0].orderBy).toEqual({
        name: SortOrder.ASC,
      });
    });

    it('should count only non-deleted units', async () => {
      prisma.property.findMany.mockResolvedValue([]);

      await service.findAll({});

      const include = prisma.property.findMany.mock.calls[0][0].include;
      expect(include._count.select.units).toEqual({
        where: { deletedAt: null },
      });
    });
  });

  describe('findOne', () => {
    it('should return property with relations', async () => {
      const prop = mockProperty();
      prisma.property.findUnique.mockResolvedValue(prop);

      const result = await service.findOne('prop-1');

      expect(result).toEqual(prop);
      expect(prisma.property.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prop-1', deletedAt: null },
        }),
      );
    });

    it('should request enriched extraction relations for deep visualization', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty());

      await service.findOne('prop-1');

      const include = prisma.property.findUnique.mock.calls[0][0].include;
      expect(include.documents).toEqual({ orderBy: { uploadedAt: 'desc' } });
      expect(include.aiExtractionJobs).toEqual(
        expect.objectContaining({
          take: 1,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(include.buildings.include._count.select.units).toEqual({
        where: { deletedAt: null },
      });
    });

    it('should throw NotFoundException when property not found', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update existing property', async () => {
      const existing = mockProperty();
      prisma.property.findUnique.mockResolvedValue(existing);
      prisma.property.update.mockResolvedValue({ ...existing, name: 'Updated' });

      const result = await service.update('prop-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException for non-existent property', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('finalize', () => {
    it('should finalize a valid DRAFT WEG property', async () => {
      const prop = mockProperty({
        status: PropertyStatus.DRAFT,
        managementType: 'WEG',
        managerId: 'mgr-1',
        units: [
          mockUnit({ coOwnershipShare: 500 }),
          mockUnit({ id: 'unit-2', coOwnershipShare: 500 }),
        ],
      });
      prisma.property.findUnique.mockResolvedValue(prop);
      prisma.property.update.mockResolvedValue({ ...prop, status: PropertyStatus.ACTIVE });

      const result = await service.finalize('prop-1');

      expect(result.status).toBe(PropertyStatus.ACTIVE);
    });

    it('should throw NotFoundException for missing property', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.finalize('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for non-DRAFT property', async () => {
      const prop = mockProperty({ status: PropertyStatus.ACTIVE, units: [] });
      prisma.property.findUnique.mockResolvedValue(prop);

      await expect(service.finalize('prop-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for WEG without manager', async () => {
      const prop = mockProperty({
        status: PropertyStatus.DRAFT,
        managementType: 'WEG',
        managerId: null,
        units: [mockUnit()],
      });
      prisma.property.findUnique.mockResolvedValue(prop);

      await expect(service.finalize('prop-1')).rejects.toThrow(
        'WEG properties require a manager',
      );
    });

    it('should throw BadRequestException for WEG with no units', async () => {
      const prop = mockProperty({
        status: PropertyStatus.DRAFT,
        managementType: 'WEG',
        managerId: 'mgr-1',
        units: [],
      });
      prisma.property.findUnique.mockResolvedValue(prop);

      await expect(service.finalize('prop-1')).rejects.toThrow(
        'WEG properties require at least one unit',
      );
    });

    it('should throw BadRequestException for invalid co-ownership share total', async () => {
      const prop = mockProperty({
        status: PropertyStatus.DRAFT,
        managementType: 'WEG',
        managerId: 'mgr-1',
        units: [mockUnit({ coOwnershipShare: 100 })],
      });
      prisma.property.findUnique.mockResolvedValue(prop);

      await expect(service.finalize('prop-1')).rejects.toThrow(
        'Invalid co-ownership share total',
      );
    });
  });

  describe('bulkCreateBuildings', () => {
    it('should create buildings for a property', async () => {
      prisma.building.createMany.mockResolvedValue({ count: 2 });

      const items = [
        { label: 'A', street: 'St1', houseNumber: '1', zipCode: '10115', city: 'Berlin' },
        { label: 'B' },
      ];

      const result = await service.bulkCreateBuildings('prop-1', items as any);

      expect(prisma.building.createMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 2 });
    });
  });

  describe('bulkCreateUnits', () => {
    it('should create units for a property', async () => {
      prisma.unit.createMany.mockResolvedValue({ count: 3 });

      const items = [
        { number: '1', type: 'APARTMENT', buildingId: 'bldg-1' },
      ];

      const result = await service.bulkCreateUnits('prop-1', items as any);

      expect(prisma.unit.createMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('ListPropertiesDto validation', () => {
    it('should parse explicit boolean query values for onlyWithUnits', () => {
      const dtoTrue = plainToInstance(ListPropertiesDto, { onlyWithUnits: 'true' });
      const dtoFalse = plainToInstance(ListPropertiesDto, { onlyWithUnits: 'false' });

      expect(validateSync(dtoTrue)).toHaveLength(0);
      expect(validateSync(dtoFalse)).toHaveLength(0);
      expect(dtoTrue.onlyWithUnits).toBe(true);
      expect(dtoFalse.onlyWithUnits).toBe(false);
    });

    it('should reject invalid boolean query values for onlyWithUnits', () => {
      const dto = plainToInstance(ListPropertiesDto, { onlyWithUnits: 'yes' });

      const errors = validateSync(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('onlyWithUnits');
    });
  });
});
