import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AiExtractionService } from '../ai-extraction/ai-extraction.service';
import { ExtractPersistResultDto } from './dto/extract-result.dto';
import { ExtractDocumentDto } from './dto/extract-document.dto';
import { PrismaService } from '../database/prisma.service';
import {
  AiJobStatus,
  DocumentType,
  PropertySource,
  UnitType,
  Prisma,
} from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly aiExtractionService: AiExtractionService,
    private readonly prisma: PrismaService,
  ) {}

  async upload(files: Express.Multer.File[]): Promise<{ storagePath: string; size: number }[]> {
    return files.map((file) => ({
      storagePath: `storage/${Date.now()}/${file.originalname}`,
      size: file.size,
    }));
  }

  async extract(
    file: Express.Multer.File,
    dto: ExtractDocumentDto,
  ): Promise<ExtractPersistResultDto> {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, deletedAt: null },
      select: { id: true, sourceDocumentId: true },
    });

    if (!property) {
      throw new NotFoundException(`Property ${dto.propertyId} not found`);
    }

    const extraction = await this.aiExtractionService.extractFromPdf(file.buffer);
    const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const extractedData = Prisma.validator<Prisma.InputJsonValue>()({
      confidence: extraction.confidence,
      buildings: extraction.buildings.map((building) => ({
        label: building.label,
        street: building.street ?? null,
        houseNumber: building.houseNumber ?? null,
      })),
      units: extraction.units.map((unit) => ({
        number: unit.number,
        type: unit.type,
        buildingLabel: unit.buildingLabel,
        floor: unit.floor ?? null,
        sizeSqm: unit.sizeSqm ?? null,
        coOwnershipShare: unit.coOwnershipShare ?? null,
      })),
      warning: extraction.warning ?? null,
    });
    const warningPayload = extraction.warning
      ? Prisma.validator<Prisma.InputJsonValue>()({ warning: extraction.warning })
      : undefined;
    const storagePath = `storage/${Date.now()}/${file.originalname}`;

    const unitTypes = new Set(Object.values(UnitType));

    const result = await this.prisma.$transaction(async (tx) => {
      const document = await tx.sourceDocument.create({
        data: {
          propertyId: dto.propertyId,
          type: dto.documentType ?? DocumentType.DECLARATION_OF_DIVISION,
          filename: file.originalname,
          mimeType: file.mimetype,
          storagePath,
          sizeBytes: file.size,
        },
      });

      await tx.aiExtractionJob.create({
        data: {
          propertyId: dto.propertyId,
          documentId: document.id,
          status: AiJobStatus.SUCCEEDED,
          model: modelName,
          promptVersion: 'v1',
          startedAt: new Date(),
          completedAt: new Date(),
          extractedData,
          confidenceScore: extraction.confidence,
          validationIssues: warningPayload,
        },
      });

      const buildingByLabel = new Map<string, { id: string }>();
      const labels = new Set<string>();
      const buildingDetails = new Map<string, { street?: string; houseNumber?: string }>();

      for (const building of extraction.buildings ?? []) {
        if (!building.label) {
          throw new BadRequestException('Extracted building is missing a label');
        }
        labels.add(building.label);
        if (!buildingDetails.has(building.label)) {
          buildingDetails.set(building.label, {
            street: building.street,
            houseNumber: building.houseNumber,
          });
        }
      }

      for (const unit of extraction.units ?? []) {
        if (!unit.buildingLabel) {
          throw new BadRequestException(
            `Unit ${unit.number ?? ''} is missing a buildingLabel`,
          );
        }
        labels.add(unit.buildingLabel);
      }

      if (labels.size > 0) {
        const existingBuildings = await tx.building.findMany({
          where: {
            propertyId: dto.propertyId,
            label: { in: Array.from(labels) },
          },
          select: { id: true, label: true },
        });

        for (const building of existingBuildings) {
          if (building.label) {
            buildingByLabel.set(building.label, { id: building.id });
          }
        }
      }

      let buildingsCreated = 0;
      for (const label of labels) {
        if (!buildingByLabel.has(label)) {
          const details = buildingDetails.get(label);
          const created = await tx.building.create({
            data: {
              propertyId: dto.propertyId,
              label,
              street: details?.street ?? '',
              houseNumber: details?.houseNumber ?? '',
              zipCode: '',
              city: '',
            },
            select: { id: true },
          });
          buildingByLabel.set(label, { id: created.id });
          buildingsCreated += 1;
        }
      }

      let unitsCreated = 0;
      let unitsUpdated = 0;

      for (const unit of extraction.units ?? []) {
        if (!unit.number) {
          throw new BadRequestException('Extracted unit is missing a number');
        }

        if (!unitTypes.has(unit.type as UnitType)) {
          throw new BadRequestException(`Unsupported unit type: ${unit.type}`);
        }

        const building = buildingByLabel.get(unit.buildingLabel);
        if (!building) {
          throw new BadRequestException(
            `Unit ${unit.number} references unknown building ${unit.buildingLabel}`,
          );
        }

        const existingUnit = await tx.unit.findFirst({
          where: {
            propertyId: dto.propertyId,
            buildingId: building.id,
            number: unit.number,
            deletedAt: null,
          },
          select: { id: true },
        });

        const unitData = {
          type: unit.type as UnitType,
          floor: unit.floor,
          sizeSqm: unit.sizeSqm,
          coOwnershipShare: unit.coOwnershipShare,
          isAiGenerated: true,
          isVerified: false,
        };

        if (existingUnit) {
          await tx.unit.update({
            where: { id: existingUnit.id },
            data: unitData,
          });
          unitsUpdated += 1;
        } else {
          await tx.unit.create({
            data: {
              ...unitData,
              number: unit.number,
              propertyId: dto.propertyId,
              buildingId: building.id,
            },
          });
          unitsCreated += 1;
        }
      }

      const propertyUpdate: Prisma.PropertyUpdateInput = {
        source: PropertySource.AI_ASSISTED,
        aiConfidenceScore: extraction.confidence,
        aiMeta: warningPayload,
      };

      if (!property.sourceDocumentId) {
        propertyUpdate.sourceDocument = { connect: { id: document.id } };
      }

      await tx.property.update({
        where: { id: dto.propertyId },
        data: propertyUpdate,
      });

      return {
        documentId: document.id,
        buildingsCreated,
        unitsCreated,
        unitsUpdated,
      };
    });

    return {
      ...extraction,
      propertyId: dto.propertyId,
      documentId: result.documentId,
      buildingsCreated: result.buildingsCreated,
      unitsCreated: result.unitsCreated,
      unitsUpdated: result.unitsUpdated,
    };
  }
}
