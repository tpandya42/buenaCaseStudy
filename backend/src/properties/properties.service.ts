import { Injectable, BadRequestException } from '@nestjs/common';
import { PropertiesPrismaService } from './properties.prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto/create-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto/list-properties.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prismaService: PropertiesPrismaService) {}

  async createDraft(dto: CreatePropertyDto) {
    if (dto.managementType === 'WEG' && !dto.managerId) {
      throw new BadRequestException('WEG properties require a manager');
    }
    return this.prismaService.createDraft(dto);
  }

  async findAll(dto: ListPropertiesDto) {
    return this.prismaService.findAll(dto);
  }

  async findOne(id: string) {
    return this.prismaService.findOne(id);
  }

  async update(id: string, data: Partial<CreatePropertyDto>) {
    return this.prismaService.update(id, data);
  }

  async finalize(id: string) {
    return this.prismaService.finalize(id);
  }
}
