import { AiExtractionService } from './ai-extraction.service';
import { BadRequestException } from '@nestjs/common';

// Mock pdf-parse
jest.mock('pdf-parse', () =>
  jest.fn().mockImplementation((buffer: Buffer) => {
    const text = buffer.toString();
    if (text === 'empty') return Promise.resolve({ text: '' });
    return Promise.resolve({ text });
  }),
);

// Mock GoogleGenerativeAI
const mockGenerateContent = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe('AiExtractionService', () => {
  let service: AiExtractionService;

  describe('when API key is configured', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      service = new AiExtractionService();
    });

    afterEach(() => {
      delete process.env.GEMINI_API_KEY;
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should extract data from PDF buffer', async () => {
      const mockResponse = {
        property: {
          name: 'Musterstr. 1',
          managementType: 'WEG',
          ownershipType: 'FREEHOLD',
          street: 'Musterstr.',
          houseNumber: '1',
          zipCode: '10115',
          city: 'Berlin',
          country: 'DE',
        },
        buildings: [{ label: 'Haus A', street: 'Musterstr.', houseNumber: '1' }],
        units: [
          {
            number: '1',
            type: 'APARTMENT',
            buildingLabel: 'Haus A',
            floor: 'EG',
            sizeSqm: 80,
            coOwnershipShare: 1000,
          },
        ],
      };

      mockGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const buffer = Buffer.from('Teilungserklärung document content');
      const result = await service.extractFromPdf(buffer);

      expect(result.buildings).toHaveLength(1);
      expect(result.units).toHaveLength(1);
      expect(result.property.name).toBe('Musterstr. 1');
      expect(result.warnings).toBeUndefined();
    });

    it('should add warning when share sum is off', async () => {
      const mockResponse = {
        property: { name: 'Musterstr. 1', managementType: 'WEG' },
        buildings: [{ label: 'Haus A' }],
        units: [
          { number: '1', type: 'APARTMENT', buildingLabel: 'Haus A', coOwnershipShare: 200 },
        ],
      };

      mockGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockResponse) },
      });

      const buffer = Buffer.from('Some valid text content');
      const result = await service.extractFromPdf(buffer);

      expect(result.warnings?.[0]).toContain('Co-ownership share sum');
    });

    it('should throw when PDF has no text', async () => {
      const buffer = Buffer.from('empty');

      await expect(service.extractFromPdf(buffer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw when AI returns invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'not json at all' },
      });

      const buffer = Buffer.from('Some text content');

      await expect(service.extractFromPdf(buffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('when API key is not configured', () => {
    beforeEach(() => {
      delete process.env.GEMINI_API_KEY;
      service = new AiExtractionService();
    });

    it('should throw BadRequestException', async () => {
      const buffer = Buffer.from('content');

      await expect(service.extractFromPdf(buffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.extractFromPdf(buffer)).rejects.toThrow(
        'AI extraction is unavailable',
      );
    });
  });
});
