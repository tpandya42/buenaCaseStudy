import { IsString, IsOptional } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  label: string;

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
