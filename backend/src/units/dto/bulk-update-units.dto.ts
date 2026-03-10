import {
  ValidateNested,
  ArrayMinSize,
  IsArray,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UnitType } from '@prisma/client';

/**
 * Each item in a bulk-update payload must include the unit `id`
 * plus any fields to change.
 */
export class BulkUpdateUnitItem {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @IsOptional()
  @IsString()
  buildingId?: string;

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

export class BulkUpdateUnitsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => BulkUpdateUnitItem)
  items: BulkUpdateUnitItem[];
}
