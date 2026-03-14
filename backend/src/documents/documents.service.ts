import { Injectable } from '@nestjs/common';
import { AiExtractionService } from '../ai-extraction/ai-extraction.service';
import { ExtractPersistResultDto } from './dto/extract-result.dto';
import { ExtractDocumentDto } from './dto/extract-document.dto';
import { PrismaService } from '../database/prisma.service';
import {
  AiJobStatus,
  DocumentType,
  ManagementType,
  OwnershipType,
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
    const extraction = await this.aiExtractionService.extractFromPdf(file.buffer);
    const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const warnings: string[] = [...(extraction.warnings ?? [])];
    const storagePath = `storage/${Date.now()}/${file.originalname}`;

    const unitTypes = new Set(Object.values(UnitType));
    const managementTypes = new Set(Object.values(ManagementType));
    const ownershipTypes = new Set(Object.values(OwnershipType));

    const result = await this.prisma.$transaction(async (tx) => {
      const extractedProperty = extraction.property ?? {};
      const managementType = managementTypes.has(
        extractedProperty.managementType as ManagementType,
      )
        ? (extractedProperty.managementType as ManagementType)
        : ManagementType.WEG;
      if (
        extractedProperty.managementType &&
        !managementTypes.has(extractedProperty.managementType as ManagementType)
      ) {
        warnings.push(
          `Unknown managementType "${extractedProperty.managementType}" — defaulted to WEG`,
        );
      }

      const ownershipType = ownershipTypes.has(
        extractedProperty.ownershipType as OwnershipType,
      )
        ? (extractedProperty.ownershipType as OwnershipType)
        : undefined;
      if (
        extractedProperty.ownershipType &&
        !ownershipTypes.has(extractedProperty.ownershipType as OwnershipType)
      ) {
        warnings.push(
          `Unknown ownershipType "${extractedProperty.ownershipType}" — ignored`,
        );
      }

      const addressLabel = [
        extractedProperty.street,
        extractedProperty.houseNumber,
        extractedProperty.city,
      ]
        .filter((value) => value && value.trim().length > 0)
        .join(' ');
      const propertyName =
        extractedProperty.name?.trim() ||
        addressLabel ||
        `Extracted Property ${Date.now()}`;
      const propertyNumber =
        extractedProperty.propertyNumber?.trim() || `PROP-${Date.now()}`;

      await tx.organization.upsert({
        where: { id: dto.organizationId },
        update: {},
        create: {
          id: dto.organizationId,
          name: dto.organizationId,
          slug: dto.organizationId,
        },
      });

      const property = await tx.property.create({
        data: {
          organizationId: dto.organizationId,
          name: propertyName,
          managementType,
          propertyNumber,
          status: 'DRAFT',
          source: PropertySource.AI_ASSISTED,
          ownershipType,
          street: extractedProperty.street ?? null,
          houseNumber: extractedProperty.houseNumber ?? null,
          zipCode: extractedProperty.zipCode ?? null,
          city: extractedProperty.city ?? null,
          country: extractedProperty.country ?? 'DE',
        },
        select: { id: true },
      });

      const document = await tx.sourceDocument.create({
        data: {
          propertyId: property.id,
          type: dto.documentType ?? DocumentType.DECLARATION_OF_DIVISION,
          filename: file.originalname,
          mimeType: file.mimetype,
          storagePath,
          sizeBytes: file.size,
        },
      });

      const buildingByLabel = new Map<string, { id: string }>();
      const labels = new Set<string>();
      const buildingDetails = new Map<string, { street?: string; houseNumber?: string }>();

      const normalizedBuildings = (extraction.buildings ?? []).map(
        (building, index) => {
          const label =
            building.label?.trim() ||
            (building.street && building.houseNumber
              ? `${building.street} ${building.houseNumber}`
              : undefined) ||
            `Building ${index + 1}`;
          return { ...building, label };
        },
      );

      for (const building of normalizedBuildings) {
        labels.add(building.label);
        if (!buildingDetails.has(building.label)) {
          buildingDetails.set(building.label, {
            street: building.street,
            houseNumber: building.houseNumber,
          });
        }
      }

      const normalizedUnits = (extraction.units ?? []).map((unit, index) => {
        const number = unit.number?.trim() || `Unit ${index + 1}`;
        return { ...unit, number };
      });

      for (const unit of normalizedUnits) {
        if (unit.buildingLabel) {
          labels.add(unit.buildingLabel);
        }
      }

      if (labels.size > 0) {
        const existingBuildings = await tx.building.findMany({
          where: {
            propertyId: property.id,
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
              propertyId: property.id,
              label,
              street: details?.street ?? extractedProperty.street ?? '',
              houseNumber: details?.houseNumber ?? extractedProperty.houseNumber ?? '',
              zipCode: extractedProperty.zipCode ?? '',
              city: extractedProperty.city ?? '',
            },
            select: { id: true },
          });
          buildingByLabel.set(label, { id: created.id });
          buildingsCreated += 1;
        }
      }

      let unitsCreated = 0;
      let unitsUpdated = 0;

      for (const unit of normalizedUnits) {
        if (!unit.type || !unitTypes.has(unit.type as UnitType)) {
          warnings.push(
            `Unit ${unit.number} has unsupported type "${unit.type ?? 'unknown'}"`,
          );
          continue;
        }

        let buildingLabel = unit.buildingLabel;
        if (!buildingLabel) {
          if (normalizedBuildings.length === 1) {
            buildingLabel = normalizedBuildings[0].label;
          } else {
            warnings.push(`Unit ${unit.number} is missing a buildingLabel`);
            continue;
          }
        }

        const building = buildingByLabel.get(buildingLabel);
        if (!building) {
          warnings.push(
            `Unit ${unit.number} references unknown building "${buildingLabel}"`,
          );
          continue;
        }

        const existingUnit = await tx.unit.findFirst({
          where: {
            propertyId: property.id,
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
          entrance: unit.entrance,
          stairwell: unit.stairwell,
          sideOfBuilding: unit.sideOfBuilding,
          constructionYear: unit.constructionYear,
          rooms: unit.rooms,
          isCommonProperty: unit.isCommonProperty ?? false,
          usageNotes: unit.usageNotes,
          docReference: unit.docReference,
          externalId: unit.externalId,
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
              propertyId: property.id,
              buildingId: building.id,
            },
          });
          unitsCreated += 1;
        }
      }

      const extractedPropertyPayload: Prisma.InputJsonObject = {
        name: extraction.property?.name ?? null,
        managementType: extraction.property?.managementType ?? null,
        ownershipType: extraction.property?.ownershipType ?? null,
        propertyNumber: extraction.property?.propertyNumber ?? null,
        street: extraction.property?.street ?? null,
        houseNumber: extraction.property?.houseNumber ?? null,
        zipCode: extraction.property?.zipCode ?? null,
        city: extraction.property?.city ?? null,
        country: extraction.property?.country ?? null,
      };

      const extractedData = Prisma.validator<Prisma.InputJsonValue>()({
        property: extractedPropertyPayload,
        buildings: normalizedBuildings.map((building) => ({
          label: building.label,
          street: building.street ?? null,
          houseNumber: building.houseNumber ?? null,
          zipCode: building.zipCode ?? null,
          city: building.city ?? null,
          additionalInfo: building.additionalInfo ?? null,
          docReference: building.docReference ?? null,
          externalId: building.externalId ?? null,
        })),
        units: normalizedUnits.map((unit) => ({
          number: unit.number,
          type: unit.type,
          buildingLabel: unit.buildingLabel,
          floor: unit.floor ?? null,
          entrance: unit.entrance ?? null,
          stairwell: unit.stairwell ?? null,
          sideOfBuilding: unit.sideOfBuilding ?? null,
          sizeSqm: unit.sizeSqm ?? null,
          coOwnershipShare: unit.coOwnershipShare ?? null,
          constructionYear: unit.constructionYear ?? null,
          rooms: unit.rooms ?? null,
          isCommonProperty: unit.isCommonProperty ?? null,
          usageNotes: unit.usageNotes ?? null,
          docReference: unit.docReference ?? null,
          externalId: unit.externalId ?? null,
        })),
        warnings: warnings.length > 0 ? warnings : null,
      });
      const warningPayload =
        warnings.length > 0
          ? Prisma.validator<Prisma.InputJsonValue>()({ warnings })
          : undefined;

      await tx.aiExtractionJob.create({
        data: {
          propertyId: property.id,
          documentId: document.id,
          status: AiJobStatus.SUCCEEDED,
          model: modelName,
          promptVersion: 'v1',
          startedAt: new Date(),
          completedAt: new Date(),
          extractedData,
          confidenceScore: null,
          validationIssues: warningPayload,
        },
      });

      const propertyUpdate: Prisma.PropertyUpdateInput = {
        source: PropertySource.AI_ASSISTED,
        aiConfidenceScore: null,
        aiMeta: warningPayload,
      };

      await tx.property.update({
        where: { id: property.id },
        data: propertyUpdate,
      });

      return {
        documentId: document.id,
        propertyId: property.id,
        buildingsCreated,
        unitsCreated,
        unitsUpdated,
      };
    });

    return {
      ...extraction,
      warnings: warnings.length > 0 ? warnings : undefined,
      propertyId: result.propertyId,
      documentId: result.documentId,
      buildingsCreated: result.buildingsCreated,
      unitsCreated: result.unitsCreated,
      unitsUpdated: result.unitsUpdated,
    };
  }
}
