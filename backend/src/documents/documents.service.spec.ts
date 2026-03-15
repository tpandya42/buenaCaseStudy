import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { AiExtractionService } from '../ai-extraction/ai-extraction.service';
import { PrismaService } from '../database/prisma.service';
import { createPrismaMock, PrismaMock } from '../test-utils/prisma-mock.factory';
import { mockBuilding, mockProperty, mockUnit } from '../test-utils/fixtures';

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
    it('should persist extraction results and create a new property', async () => {
      const mockResult = {
        property: {
          name: 'Musterstr. 1',
          managementType: 'WEG',
          street: 'Musterstr.',
          houseNumber: '1',
          zipCode: '10115',
          city: 'Berlin',
        },
        buildings: [{ label: 'Haus A', street: 'Musterstr.', houseNumber: '1' }],
        units: [{ number: '1', type: 'APARTMENT', buildingLabel: 'Haus A' }],
      };
      aiService.extractFromPdf.mockResolvedValue(mockResult);
      prisma.organization.upsert.mockResolvedValue({ id: 'org-1' } as any);
      prisma.property.create.mockResolvedValue({ id: 'prop-1' } as any);
      prisma.sourceDocument.create.mockResolvedValue({ id: 'doc-1' } as any);
      prisma.aiExtractionJob.create.mockResolvedValue({ id: 'job-1' } as any);
      prisma.building.findMany.mockResolvedValue([]);
      prisma.building.create.mockResolvedValue(mockBuilding());
      prisma.unit.findFirst.mockResolvedValue(null);
      prisma.unit.create.mockResolvedValue(mockUnit({ isAiGenerated: true }));
      prisma.property.update.mockResolvedValue(mockProperty({ source: 'AI_ASSISTED' }));

      const file = { buffer: Buffer.from('pdf content') } as Express.Multer.File;
      const result = await service.extract(file, { organizationId: 'org-1' });

      expect(aiService.extractFromPdf).toHaveBeenCalledWith(file.buffer);
      expect(prisma.organization.upsert).toHaveBeenCalled();
      expect(prisma.property.create).toHaveBeenCalled();
      expect(prisma.sourceDocument.create).toHaveBeenCalled();
      expect(prisma.unit.create).toHaveBeenCalled();
      expect(result.propertyId).toBe('prop-1');
    });

    it('should reject extraction when no meaningful deal information is found', async () => {
      aiService.extractFromPdf.mockResolvedValue({
        property: {
          name: '   ',
          propertyNumber: '',
          street: '',
          houseNumber: '',
          zipCode: '',
          city: '',
          country: '',
        },
        buildings: [{}],
        units: [{}],
      });

      const file = { buffer: Buffer.from('random pdf') } as Express.Multer.File;

      await expect(
        service.extract(file, { organizationId: 'org-1' }),
      ).rejects.toThrow(
        'No extractable property deal information found in the submitted PDF',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.organization.upsert).not.toHaveBeenCalled();
      expect(prisma.property.create).not.toHaveBeenCalled();
      expect(prisma.sourceDocument.create).not.toHaveBeenCalled();
    });

    it('should propagate errors from AI service', async () => {
      aiService.extractFromPdf.mockRejectedValue(
        new Error('AI extraction failed'),
      );

      const file = { buffer: Buffer.from('bad pdf') } as Express.Multer.File;

      await expect(
        service.extract(file, { organizationId: 'org-1' }),
      ).rejects.toThrow('AI extraction failed');
    });
  });
});
