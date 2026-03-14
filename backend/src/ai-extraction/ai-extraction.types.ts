export interface ExtractedProperty {
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

export interface ExtractedBuilding {
  label?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  additionalInfo?: string;
  docReference?: string;
  externalId?: string;
}

export interface ExtractedUnit {
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

export interface ExtractionResult {
  property: ExtractedProperty;
  buildings: ExtractedBuilding[];
  units: ExtractedUnit[];
  warnings?: string[];
}
