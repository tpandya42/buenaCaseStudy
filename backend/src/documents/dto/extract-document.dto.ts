import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class ExtractDocumentDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;
}
