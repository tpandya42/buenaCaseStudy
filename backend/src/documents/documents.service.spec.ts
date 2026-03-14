import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { AiExtractionService } from '../ai-extraction/ai-extraction.service';
import { PrismaService } from '../database/prisma.service';
import { createPrismaMock, PrismaMock } from '../test-utils/prisma-mock.factory';
import { mockBuilding, mockProperty, mockUnit } from '../test-utils/fixtures';
import { NotFoundException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let aiService: jest.Mocked<AiExtractionService>;
  let prisma: PrismaMock;

  beforeEach(async () => {
    const mockAiService = {
      extractFromPdf: jest.fn(),
    };
    prisma = createPrismaMock();
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: AiExtractionService, useValue: mockAiService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    aiService = module.get(AiExtractionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should return storage paths for uploaded files', async () => {
      const files = [
        { originalname: 'doc1.pdf', size: 1024 },
        { originalname: 'doc2.pdf', size: 2048 },
      ] as Express.Multer.File[];

      const result = await service.upload(files);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          storagePath: expect.stringContaining('doc1.pdf'),
          size: 1024,
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          storagePath: expect.stringContaining('doc2.pdf'),
          size: 2048,
        }),
      );
    });

    it('should generate unique storage paths', async () => {
      const files = [
        { originalname: 'same.pdf', size: 100 },
      ] as Express.Multer.File[];

      const result = await service.upload(files);

      expect(result[0].storagePath).toMatch(/^storage\/\d+\/same\.pdf$/);
    });
  });

  describe('extract', () => {
    it('should persist extraction results for a property', async () => {
      const mockResult = {
        confidence: 95,
        buildings: [{ label: 'Haus A', street: 'Musterstr.', houseNumber: '1' }],
        units: [{ number: '1', type: 'APARTMENT', buildingLabel: 'Haus A' }],
      };
      aiService.extractFromPdf.mockResolvedValue(mockResult);
      prisma.property.findFirst.mockResolvedValue(mockProperty());
      prisma.sourceDocument.create.mockResolvedValue({ id: 'doc-1' } as any);
      prisma.aiExtractionJob.create.mockResolvedValue({ id: 'job-1' } as any);
      prisma.building.findMany.mockResolvedValue([]);
      prisma.building.create.mockResolvedValue(mockBuilding());
      prisma.unit.findFirst.mockResolvedValue(null);
      prisma.unit.create.mockResolvedValue(mockUnit({ isAiGenerated: true }));
      prisma.property.update.mockResolvedValue(mockProperty({ source: 'AI_ASSISTED' }));

      const file = { buffer: Buffer.from('pdf content') } as Express.Multer.File;
      const result = await service.extract(file, { propertyId: 'prop-1' });

      expect(aiService.extractFromPdf).toHaveBeenCalledWith(file.buffer);
      expect(prisma.sourceDocument.create).toHaveBeenCalled();
      expect(prisma.unit.create).toHaveBeenCalled();
      expect(result.documentId).toBe('doc-1');
    });

    it('should throw when property is missing', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      const file = { buffer: Buffer.from('pdf content') } as Express.Multer.File;

      await expect(
        service.extract(file, { propertyId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate errors from AI service', async () => {
      prisma.property.findFirst.mockResolvedValue(mockProperty());
      aiService.extractFromPdf.mockRejectedValue(
        new Error('AI extraction failed'),
      );

      const file = { buffer: Buffer.from('bad pdf') } as Express.Multer.File;

      await expect(
        service.extract(file, { propertyId: 'prop-1' }),
      ).rejects.toThrow('AI extraction failed');
    });
  });
});
