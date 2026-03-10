import { ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBuildingDto } from '../../buildings/dto/create-building.dto/create-building.dto';

export class BulkCreateBuildingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateBuildingDto)
  items: CreateBuildingDto[];
}
