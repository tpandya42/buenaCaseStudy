import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { PropertiesPrismaService } from './properties.prisma.service';
import { BadRequestException } from '@nestjs/common';
import { ManagementType } from '@prisma/client';
import { mockProperty } from '../test-utils/fixtures';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let prismaSvc: jest.Mocked<PropertiesPrismaService>;

  beforeEach(async () => {
    const mockPrismaSvc = {
      createDraft: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      finalize: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PropertiesPrismaService, useValue: mockPrismaSvc },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    prismaSvc = module.get(PropertiesPrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDraft', () => {
    it('should throw BadRequestException for WEG without managerId', async () => {
      const dto = {
        name: 'Test',
        managementType: ManagementType.WEG,
        organizationId: 'org-1',
      };

      await expect(service.createDraft(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createDraft(dto)).rejects.toThrow(
        'WEG properties require a manager',
      );
    });

    it('should allow WEG with managerId', async () => {
      const dto = {
        name: 'Test',
        managementType: ManagementType.WEG,
        organizationId: 'org-1',
        managerId: 'manager-1',
      };
      const expected = mockProperty(dto);
      prismaSvc.createDraft.mockResolvedValue(expected as any);

      const result = await service.createDraft(dto);

      expect(prismaSvc.createDraft).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should allow MV without managerId', async () => {
      const dto = {
        name: 'Test MV',
        managementType: ManagementType.MV,
        organizationId: 'org-1',
      };
      const expected = mockProperty({ ...dto, managementType: ManagementType.MV });
      prismaSvc.createDraft.mockResolvedValue(expected as any);

      const result = await service.createDraft(dto);

      expect(prismaSvc.createDraft).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should delegate to prisma service', async () => {
      const dto = { search: 'test' };
      const expected = [mockProperty()];
      prismaSvc.findAll.mockResolvedValue(expected as any);

      const result = await service.findAll(dto);

      expect(prismaSvc.findAll).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to prisma service', async () => {
      const expected = mockProperty();
      prismaSvc.findOne.mockResolvedValue(expected as any);

      const result = await service.findOne('prop-1');

      expect(prismaSvc.findOne).toHaveBeenCalledWith('prop-1');
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should delegate to prisma service with partial data', async () => {
      const data = { name: 'Updated' };
      const expected = mockProperty({ name: 'Updated' });
      prismaSvc.update.mockResolvedValue(expected as any);

      const result = await service.update('prop-1', data);

      expect(prismaSvc.update).toHaveBeenCalledWith('prop-1', data);
      expect(result).toEqual(expected);
    });
  });

  describe('finalize', () => {
    it('should delegate to prisma service', async () => {
      const expected = mockProperty({ status: 'ACTIVE' });
      prismaSvc.finalize.mockResolvedValue(expected as any);

      const result = await service.finalize('prop-1');

      expect(prismaSvc.finalize).toHaveBeenCalledWith('prop-1');
      expect(result).toEqual(expected);
    });
  });
});
