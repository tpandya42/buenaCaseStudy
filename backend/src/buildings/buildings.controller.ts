import { Controller, Patch, Param, Body } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { UpdateBuildingDto } from './dto/update-building.dto/update-building.dto';
import { SkipAuth } from '../auth/skip-auth.decorator';

@SkipAuth()
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.buildingsService.update(id, dto);
  }
}
