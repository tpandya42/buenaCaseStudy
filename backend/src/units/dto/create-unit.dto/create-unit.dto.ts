import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { UnitType } from '@prisma/client';

export class CreateUnitDto {
  @IsString()
  number: string;

  @IsEnum(UnitType)
  type: UnitType;

  @IsString()
  buildingId: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsNumber()
  sizeSqm?: number;

  @IsOptional()
  @IsNumber()
  coOwnershipShare?: number;

  @IsOptional()
  @IsBoolean()
  isCommonProperty?: boolean;

  @IsOptional()
  @IsString()
  entrance?: string;

  @IsOptional()
  @IsString()
  stairwell?: string;

  @IsOptional()
  @IsString()
  usageNotes?: string;
}
