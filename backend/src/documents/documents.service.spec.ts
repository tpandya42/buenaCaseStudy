import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { AiExtractionService } from '../ai-extraction/ai-extraction.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let aiService: jest.Mocked<AiExtractionService>;

  beforeEach(async () => {
    const mockAiService = {
      extractFromPdf: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: AiExtractionService, useValue: mockAiService },
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
    it('should delegate to AI extraction service', async () => {
      const mockResult = {
        confidence: 95,
        buildings: [{ label: 'Haus A', street: 'Musterstr.', houseNumber: '1' }],
        units: [{ number: '1', type: 'APARTMENT', buildingLabel: 'Haus A' }],
      };
      aiService.extractFromPdf.mockResolvedValue(mockResult);

      const file = { buffer: Buffer.from('pdf content') } as Express.Multer.File;
      const result = await service.extract(file);

      expect(aiService.extractFromPdf).toHaveBeenCalledWith(file.buffer);
      expect(result).toEqual(mockResult);
    });

    it('should propagate errors from AI service', async () => {
      aiService.extractFromPdf.mockRejectedValue(
        new Error('AI extraction failed'),
      );

      const file = { buffer: Buffer.from('bad pdf') } as Express.Multer.File;

      await expect(service.extract(file)).rejects.toThrow(
        'AI extraction failed',
      );
    });
  });
});
