import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { BulkCreateUnitsDto } from './dto/bulk-create-units.dto';
import { BulkUpdateUnitsDto } from './dto/bulk-update-units.dto';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  /* ── List all units for a property ──────────────────────────────── */
  @Get('property/:propertyId')
  async findByProperty(@Param('propertyId') propertyId: string) {
    return this.unitsService.findByProperty(propertyId);
  }

  /* ── Get a single unit ──────────────────────────────────────────── */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  /* ── Bulk create units for a property ───────────────────────────── */
  @Post('property/:propertyId/bulk')
  async bulkCreate(
    @Param('propertyId') propertyId: string,
    @Body() dto: BulkCreateUnitsDto,
  ) {
    return this.unitsService.bulkCreate(propertyId, dto.items);
  }

  /* ── Bulk update units for a property ───────────────────────────── */
  @Patch('property/:propertyId/bulk')
  async bulkUpdate(
    @Param('propertyId') propertyId: string,
    @Body() dto: BulkUpdateUnitsDto,
  ) {
    return this.unitsService.bulkUpdate(propertyId, dto.items);
  }

  /* ── Update a single unit ───────────────────────────────────────── */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(id, dto);
  }

  /* ── Soft-delete a unit ─────────────────────────────────────────── */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}
