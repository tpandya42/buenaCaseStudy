import { Injectable } from '@nestjs/common';
import { AiExtractionService } from '../ai-extraction/ai-extraction.service';
import { ExtractResultDto } from './dto/extract-result.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly aiExtractionService: AiExtractionService) {}

  async upload(files: Express.Multer.File[]): Promise<{ storagePath: string; size: number }[]> {
    return files.map((file) => ({
      storagePath: `storage/${Date.now()}/${file.originalname}`,
      size: file.size,
    }));
  }

  async extract(file: Express.Multer.File): Promise<ExtractResultDto> {
    return this.aiExtractionService.extractFromPdf(file.buffer);
  }
}
