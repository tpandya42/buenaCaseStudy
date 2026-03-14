import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateBuildingDto } from './dto/update-building.dto/update-building.dto';

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) {}

  async update(id: string, dto: UpdateBuildingDto) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!building) {
      throw new NotFoundException(`Building ${id} not found`);
    }

    return this.prisma.building.update({
      where: { id },
      data: dto,
    });
  }
}
