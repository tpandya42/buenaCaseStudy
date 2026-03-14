import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { ExtractDocumentDto } from './dto/extract-document.dto';
import { SkipAuth } from '../auth/skip-auth.decorator';

@SkipAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.documentsService.upload(files);
  }

  @Post('extract')
  @UseInterceptors(FilesInterceptor('files'))
  async extract(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ExtractDocumentDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.documentsService.extract(files[0], dto);
  }
}
