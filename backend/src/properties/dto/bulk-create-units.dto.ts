import { ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUnitDto } from '../../units/dto/create-unit.dto/create-unit.dto';

export class BulkCreateUnitsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateUnitDto)
  items: CreateUnitDto[];
}
