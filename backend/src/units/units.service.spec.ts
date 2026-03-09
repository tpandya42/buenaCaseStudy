import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto/create-unit.dto';
import { PrismaClient } from '@prisma/client';

// Mock PrismaService for testing
const prismaMock = {
  unit: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(), // Added findFirst
    findMany: jest.fn(),
    update: jest.fn(),
  },
  property: {
    findUnique: jest.fn(),
    findFirst: jest.fn(), // Added findFirst
  },
  building: {
    findUnique: jest.fn(),
  },
};

describe('UnitsService', () => {
  let service: UnitsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test cases for soft delete
  describe('soft delete', () => {
    const mockUnit = {
      id: 'unit-id-1',
      propertyId: 'property-id-1',
      buildingId: 'building-id-1',
      number: '1',
      type: 'APARTMENT',
      floor: '1',
      entrance: 'Main',
      stairwell: 'A',
      sideOfBuilding: 'Front',
      sizeSqm: 50,
      coOwnershipShare: 1000,
      constructionYear: 2000,
      rooms: 2,
      isCommonProperty: false,
      usageNotes: null,
      docReference: null,
      externalId: null,
      isAiGenerated: false,
      isVerified: false,
      verificationMeta: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    it('should soft delete a unit', async () => {
      prismaMock.unit.update.mockResolvedValue({ ...mockUnit, deletedAt: new Date() });
      prismaMock.unit.findFirst.mockResolvedValueOnce(mockUnit); // Unit exists before deletion

      const result = await service.remove(mockUnit.id);

      expect(prismaMock.unit.update).toHaveBeenCalledWith({
        where: { id: mockUnit.id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ ...mockUnit, deletedAt: expect.any(Date) });
    });

    it('should not return a soft-deleted unit via findOne', async () => {
      const softDeletedUnit = { ...mockUnit, deletedAt: new Date() };
      prismaMock.unit.findFirst.mockResolvedValue(softDeletedUnit);

      // This test relies on the middleware to filter out the soft-deleted unit.
      // Since we are mocking Prisma, the middleware won't be applied here.
      // We need to simulate the middleware's behavior in the mock.
      prismaMock.unit.findFirst.mockImplementation((args) => {
        if (args.where && args.where.deletedAt === null) {
          return Promise.resolve(null); // Simulate middleware filtering
        }
        return Promise.resolve(softDeletedUnit);
      });

      await expect(service.findOne(mockUnit.id)).rejects.toThrow(NotFoundException);
    });

    it('should not return soft-deleted units via findByProperty', async () => {
      const liveUnit = { ...mockUnit, id: 'live-unit', deletedAt: null };
      const softDeletedUnit = { ...mockUnit, id: 'deleted-unit', deletedAt: new Date() };

      prismaMock.property.findUnique.mockResolvedValue({ id: 'property-id-1' }); // Property exists

      prismaMock.unit.findMany.mockImplementation((args) => {
        if (args.where && args.where.deletedAt === null) {
          return Promise.resolve([liveUnit]); // Simulate middleware filtering
        }
        return Promise.resolve([liveUnit, softDeletedUnit]);
      });

      const result = await service.findByProperty('property-id-1');
      expect(result).toEqual([liveUnit]);
      expect(result).not.toContainEqual(softDeletedUnit);
    });
  });
});
