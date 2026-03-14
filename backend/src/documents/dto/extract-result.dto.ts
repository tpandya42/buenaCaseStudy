export class ExtractedBuildingDto {
  label: string;
  street?: string;
  houseNumber?: string;
}

export class ExtractedUnitDto {
  number: string;
  type: string;
  buildingLabel: string;
  floor?: string;
  sizeSqm?: number;
  coOwnershipShare?: number;
}

export class ExtractResultDto {
  confidence: number;
  buildings: ExtractedBuildingDto[];
  units: ExtractedUnitDto[];
  warning?: string;
}

export class ExtractPersistResultDto extends ExtractResultDto {
  propertyId: string;
  documentId: string;
  buildingsCreated: number;
  unitsCreated: number;
  unitsUpdated: number;
}
