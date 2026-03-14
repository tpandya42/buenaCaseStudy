import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class ExtractDocumentDto {
  @IsString()
  propertyId: string;

  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;
}
