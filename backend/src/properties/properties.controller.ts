import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { SkipAuth } from '../auth/skip-auth.decorator';
import { CreatePropertyDto } from './dto/create-property.dto/create-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto/list-properties.dto';
import { BulkCreateBuildingsDto } from './dto/bulk-create-buildings.dto';
import { BulkCreateUnitsDto } from './dto/bulk-create-units.dto';
import { UpdatePropertyDto } from './dto/update-property.dto/update-property.dto';
import { PropertiesService } from './properties.service';
import { PropertiesPrismaService } from './properties.prisma.service';

@SkipAuth()
@Controller('properties')
export class PropertiesController {
    constructor(
        private readonly propertiesService: PropertiesService,
        private readonly prismaService: PropertiesPrismaService,
    ) {}

    @Post()
    async create(@Body() dto: CreatePropertyDto) {
        return this.propertiesService.createDraft(dto);
    }

    @Get()
    async findAll(@Query() dto: ListPropertiesDto) {
        return this.propertiesService.findAll(dto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.propertiesService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
        return this.propertiesService.update(id, dto);
    }

    @Post(':id/finalize')
    async finalize(@Param('id') id: string) {
        return this.propertiesService.finalize(id);
    }

    @Post(':id/buildings/bulk')
    async bulkCreateBuildings(
        @Param('id') id: string,
        @Body() dto: BulkCreateBuildingsDto,
    ) {
        return this.prismaService.bulkCreateBuildings(id, dto.items);
    }

    @Post(':id/units/bulk')
    async bulkCreateUnits(
        @Param('id') id: string,
        @Body() dto: BulkCreateUnitsDto,
    ) {
        return this.prismaService.bulkCreateUnits(id, dto.items);
    }
}
