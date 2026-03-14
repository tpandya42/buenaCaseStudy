export class ExtractedPropertyDto {
  name?: string;
  managementType?: string;
  ownershipType?: string;
  propertyNumber?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
}

export class ExtractedBuildingDto {
  label?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  additionalInfo?: string;
  docReference?: string;
  externalId?: string;
}

export class ExtractedUnitDto {
  number?: string;
  type?: string;
  buildingLabel?: string;
  floor?: string;
  entrance?: string;
  stairwell?: string;
  sideOfBuilding?: string;
  sizeSqm?: number;
  coOwnershipShare?: number;
  constructionYear?: number;
  rooms?: number;
  isCommonProperty?: boolean;
  usageNotes?: string;
  docReference?: string;
  externalId?: string;
}

export class ExtractResultDto {
  property: ExtractedPropertyDto;
  buildings: ExtractedBuildingDto[];
  units: ExtractedUnitDto[];
  warnings?: string[];
}

export class ExtractPersistResultDto extends ExtractResultDto {
  propertyId: string;
  documentId: string;
  buildingsCreated: number;
  unitsCreated: number;
  unitsUpdated: number;
}
