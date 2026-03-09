import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ManagementType } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  name: string;

  @IsEnum(ManagementType)
  managementType: ManagementType;

  @IsOptional()
  @IsString()
  propertyNumber?: string;

  @IsString()
  organizationId: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  accountantId?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
