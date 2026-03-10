import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { BulkUpdateUnitItem } from './dto/bulk-update-units.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------------ */
  /*  LIST all units for a property (includes building relation)         */
  /* ------------------------------------------------------------------ */
  async findByProperty(propertyId: string) {
    await this.ensurePropertyExists(propertyId);

    return this.prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      include: { building: true },
      orderBy: [{ building: { label: 'asc' } }, { number: 'asc' }],
    });
  }

  /* ------------------------------------------------------------------ */
  /*  GET single unit                                                    */
  /* ------------------------------------------------------------------ */
  async findOne(id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: { building: true, property: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit ${id} not found`);
    }
    return unit;
  }

  /* ------------------------------------------------------------------ */
  /*  BULK CREATE — validate that all buildingIds belong to the property */
  /* ------------------------------------------------------------------ */
  async bulkCreate(propertyId: string, items: CreateUnitDto[]) {
    await this.ensurePropertyExists(propertyId);

    // Collect unique buildingIds from the payload
    const requestedBuildingIds = [...new Set(items.map((i) => i.buildingId))];

    // Verify all buildings belong to this property
    const validBuildings = await this.prisma.building.findMany({
      where: { propertyId, id: { in: requestedBuildingIds } },
      select: { id: true },
    });
    const validIds = new Set(validBuildings.map((b) => b.id));
    const invalidIds = requestedBuildingIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `These buildingIds do not belong to property ${propertyId}: ${invalidIds.join(', ')}`,
      );
    }

    // Insert all units in a single createMany
    const data = items.map((item) => ({
      ...item,
      propertyId,
    }));

    const result = await this.prisma.unit.createMany({ data });

    // Return the newly created units
    const created = await this.prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      include: { building: true },
      orderBy: { createdAt: 'desc' },
      take: result.count,
    });

    return { count: result.count, units: created };
  }

  /* ------------------------------------------------------------------ */
  /*  BULK UPDATE — validate all unit IDs belong to the property         */
  /* ------------------------------------------------------------------ */
  async bulkUpdate(propertyId: string, items: BulkUpdateUnitItem[]) {
    await this.ensurePropertyExists(propertyId);

    const requestedUnitIds = items.map((i) => i.id);

    // Verify all units belong to this property and are not soft-deleted
    const existingUnits = await this.prisma.unit.findMany({
      where: { propertyId, id: { in: requestedUnitIds }, deletedAt: null },
      select: { id: true },
    });
    const existingIds = new Set(existingUnits.map((u) => u.id));
    const invalidIds = requestedUnitIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `These unit IDs do not belong to property ${propertyId} or are deleted: ${invalidIds.join(', ')}`,
      );
    }

    // If any item changes buildingId, validate those buildings belong to this property
    const newBuildingIds = [
      ...new Set(items.filter((i) => i.buildingId).map((i) => i.buildingId!)),
    ];
    if (newBuildingIds.length > 0) {
      const validBuildings = await this.prisma.building.findMany({
        where: { propertyId, id: { in: newBuildingIds } },
        select: { id: true },
      });
      const validBuildingIdSet = new Set(validBuildings.map((b) => b.id));
      const badBuildings = newBuildingIds.filter(
        (id) => !validBuildingIdSet.has(id),
      );
      if (badBuildings.length > 0) {
        throw new BadRequestException(
          `These buildingIds do not belong to property ${propertyId}: ${badBuildings.join(', ')}`,
        );
      }
    }

    // Run all updates in parallel
    const updated = await Promise.all(
      items.map(({ id, ...data }) =>
        this.prisma.unit.update({
          where: { id },
          data,
          include: { building: true },
        }),
      ),
    );

    return { count: updated.length, units: updated };
  }

  /* ------------------------------------------------------------------ */
  /*  UPDATE single unit                                                 */
  /* ------------------------------------------------------------------ */
  async update(id: string, dto: UpdateUnitDto) {
    await this.findOne(id); // throws 404 if missing
    return this.prisma.unit.update({
      where: { id },
      data: dto,
      include: { building: true },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  SOFT DELETE                                                         */
  /* ------------------------------------------------------------------ */
  async remove(id: string) {
    await this.findOne(id); // throws 404 if missing
    return this.prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Helper: ensure the property exists                                 */
  /* ------------------------------------------------------------------ */
  private async ensurePropertyExists(propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }
  }
}
