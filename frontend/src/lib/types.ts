/* ── Enums ──────────────────────────────────────────────────────── */

export type ManagementType = "WEG" | "MV";
export type PropertyStatus = "DRAFT" | "IN_REVIEW" | "ACTIVE" | "ARCHIVED";
export type PropertySource = "MANUAL" | "AI_ASSISTED" | "IMPORTED";
export type PropertySortBy = "createdAt" | "updatedAt" | "name";
export type SortOrder = "asc" | "desc";
export type OwnershipType = "FREEHOLD" | "LEASEHOLD";
export type UnitType = "APARTMENT" | "OFFICE" | "GARDEN" | "PARKING";
export type DocumentType = "DECLARATION_OF_DIVISION" | "OTHER";
export type AiJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

/* ── Models ─────────────────────────────────────────────────────── */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarningPayload {
  warnings?: string[];
  [key: string]: unknown;
}

export interface AiExtractionJobSummary {
  id: string;
  status: AiJobStatus;
  model: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  confidenceScore?: number | null;
  validationIssues?: WarningPayload | null;
  documentId: string;
}

export interface Property {
  id: string;
  organizationId: string;
  name: string;
  managementType: ManagementType;
  propertyNumber: string;
  status: PropertyStatus;
  source: PropertySource;
  ownershipType?: OwnershipType;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  managerId?: string;
  accountantId?: string;
  sourceDocumentId?: string;
  aiConfidenceScore?: number;
  aiMeta?: WarningPayload | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  deletedAt?: string;
  manager?: User;
  accountant?: User;
  buildings?: Building[];
  units?: Unit[];
  sourceDocument?: SourceDocument;
  documents?: SourceDocument[];
  aiExtractionJobs?: AiExtractionJobSummary[];
  _count?: { units: number; buildings: number };
}

export interface Building {
  id: string;
  propertyId: string;
  label?: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  additionalInfo?: string;
  docReference?: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
  units?: Unit[];
  _count?: { units: number };
}

export interface Unit {
  id: string;
  propertyId: string;
  buildingId: string;
  number: string;
  type: UnitType;
  floor?: string;
  entrance?: string;
  stairwell?: string;
  sideOfBuilding?: string;
  sizeSqm?: number;
  coOwnershipShare?: number;
  constructionYear?: number;
  rooms?: number;
  isCommonProperty: boolean;
  usageNotes?: string;
  docReference?: string;
  externalId?: string;
  isAiGenerated: boolean;
  isVerified: boolean;
  verificationMeta?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  building?: Building;
}

export interface SourceDocument {
  id: string;
  propertyId: string;
  type: DocumentType;
  filename: string;
  mimeType: string;
  storagePath: string;
  sizeBytes?: number;
  uploadedById?: string;
  uploadedAt: string;
}

/* ── DTOs ────────────────────────────────────────────────────────── */

export interface CreatePropertyPayload {
  name: string;
  managementType: ManagementType;
  organizationId: string;
  propertyNumber?: string;
  managerId?: string;
  accountantId?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface CreateBuildingPayload {
  label: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
}

export interface CreateUnitPayload {
  number: string;
  type: UnitType;
  buildingId: string;
  floor?: string;
  sizeSqm?: number;
  coOwnershipShare?: number;
  isCommonProperty?: boolean;
  entrance?: string;
  stairwell?: string;
  usageNotes?: string;
}

export type UpdateUnitPayload = Partial<CreateUnitPayload>;

export interface BulkUpdateUnitItem extends UpdateUnitPayload {
  id: string;
}

export interface ListPropertiesQuery {
  search?: string;
  status?: PropertyStatus;
  source?: PropertySource;
  onlyWithUnits?: boolean;
  sortBy?: PropertySortBy;
  sortOrder?: SortOrder;
}

/* ── AI Extraction ──────────────────────────────────────────────── */

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

export interface ExtractedProperty {
  name?: string;
  managementType?: ManagementType;
  ownershipType?: OwnershipType;
  propertyNumber?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  city?: string;
  country?: string;
}

export interface ExtractionResult {
  propertyId: string;
  documentId: string;
  buildingsCreated: number;
  unitsCreated: number;
  unitsUpdated: number;
  property: ExtractedProperty;
  buildings: ExtractedBuilding[];
  units: ExtractedUnit[];
  warnings?: string[];
}
