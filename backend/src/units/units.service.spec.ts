import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createPrismaMock, PrismaMock } from '../test-utils/prisma-mock.factory';
import { mockUnit } from '../test-utils/fixtures';

describe('UnitsService', () => {
  let service: UnitsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a unit when found', async () => {
      const unit = mockUnit();
      prisma.unit.findFirst.mockResolvedValue(unit);

      const result = await service.findOne('unit-1');

      expect(result).toEqual(unit);
      expect(prisma.unit.findFirst).toHaveBeenCalledWith({
        where: { id: 'unit-1', deletedAt: null },
        include: { building: true, property: true },
      });
    });

    it('should throw NotFoundException when unit not found', async () => {
      prisma.unit.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return soft-deleted units', async () => {
      prisma.unit.findFirst.mockResolvedValue(null);

      await expect(service.findOne('unit-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByProperty', () => {
    it('should return live units for a property', async () => {
      const liveUnit = mockUnit({ id: 'live-1', deletedAt: null });
      prisma.property.findFirst.mockResolvedValue({ id: 'prop-1' });
      prisma.unit.findMany.mockResolvedValue([liveUnit]);

      const result = await service.findByProperty('prop-1');

      expect(result).toEqual([liveUnit]);
      expect(prisma.unit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { propertyId: 'prop-1', deletedAt: null },
        }),
      );
    });

    it('should throw NotFoundException when property not found', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(service.findByProperty('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete a unit', async () => {
      const unit = mockUnit();
      prisma.unit.findFirst.mockResolvedValue(unit);
      prisma.unit.update.mockResolvedValue({ ...unit, deletedAt: new Date() });

      const result = await service.remove('unit-1');

      expect(prisma.unit.update).toHaveBeenCalledWith({
        where: { id: 'unit-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).toBeDefined();
    });

    it('should throw NotFoundException for missing unit', async () => {
      prisma.unit.findFirst.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing unit', async () => {
      const unit = mockUnit();
      prisma.unit.findFirst.mockResolvedValue(unit);
      prisma.unit.update.mockResolvedValue({ ...unit, floor: '2.OG' });

      const result = await service.update('unit-1', { floor: '2.OG' });

      expect(result.floor).toBe('2.OG');
    });

    it('should reject building updates to another property', async () => {
      const unit = mockUnit({ propertyId: 'prop-1' });
      prisma.unit.findFirst.mockResolvedValue(unit);
      prisma.building.findFirst.mockResolvedValue(null);

      await expect(
        service.update('unit-1', { buildingId: 'other-building' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkCreate', () => {
    it('should validate building ownership', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'prop-1' });
      prisma.building.findMany.mockResolvedValue([]);

      const items = [
        { number: '1', type: 'APARTMENT' as any, buildingId: 'invalid-bldg' },
      ];

      await expect(service.bulkCreate('prop-1', items)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create units when buildings are valid', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'prop-1' });
      prisma.building.findMany.mockResolvedValue([{ id: 'bldg-1' }]);
      prisma.unit.createMany.mockResolvedValue({ count: 1 });
      prisma.unit.findMany.mockResolvedValue([mockUnit()]);

      const items = [
        { number: '1', type: 'APARTMENT' as any, buildingId: 'bldg-1' },
      ];

      const result = await service.bulkCreate('prop-1', items);

      expect(result.count).toBe(1);
      expect(result.units).toHaveLength(1);
    });
  });

  describe('bulkUpdate', () => {
    it('should validate unit ownership', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'prop-1' });
      prisma.unit.findMany.mockResolvedValue([]);

      const items = [{ id: 'invalid-unit', floor: '3.OG' }];

      await expect(service.bulkUpdate('prop-1', items)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update units when all IDs are valid', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: 'prop-1' });
      prisma.unit.findMany.mockResolvedValue([{ id: 'unit-1' }]);
      const updatedUnit = mockUnit({ floor: '3.OG' });
      prisma.unit.update.mockResolvedValue(updatedUnit);

      const items = [{ id: 'unit-1', floor: '3.OG' }];

      const result = await service.bulkUpdate('prop-1', items);

      expect(result.count).toBe(1);
      expect(result.units[0].floor).toBe('3.OG');
    });
  });
});
