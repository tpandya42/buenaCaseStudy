export interface ExtractedBuilding {
  label: string;
  street?: string;
  houseNumber?: string;
}

export interface ExtractedUnit {
  number: string;
  type: string;
  buildingLabel: string;
  floor?: string;
  sizeSqm?: number;
  coOwnershipShare?: number;
}

export interface ExtractionResult {
  confidence: number;
  buildings: ExtractedBuilding[];
  units: ExtractedUnit[];
  warning?: string;
}
