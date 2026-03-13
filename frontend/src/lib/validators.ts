import { z } from "zod";

export const createPropertySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  managementType: z.enum(["WEG", "MV"]),
  organizationId: z.string().min(1, "Organization is required"),
  propertyNumber: z.string().optional(),
  managerId: z.string().optional(),
  accountantId: z.string().optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
});

export type CreatePropertyFormData = z.infer<typeof createPropertySchema>;

export const createBuildingSchema = z.object({
  label: z.string().min(1, "Label is required"),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
});

export type CreateBuildingFormData = z.infer<typeof createBuildingSchema>;

export const createUnitSchema = z.object({
  number: z.string().min(1, "Unit number is required"),
  type: z.enum(["APARTMENT", "OFFICE", "GARDEN", "PARKING"]),
  buildingId: z.string().min(1, "Building is required"),
  floor: z.string().optional(),
  sizeSqm: z.number().positive().optional(),
  coOwnershipShare: z.number().min(0).optional(),
  isCommonProperty: z.boolean().optional(),
  entrance: z.string().optional(),
  stairwell: z.string().optional(),
  usageNotes: z.string().optional(),
});

export type CreateUnitFormData = z.infer<typeof createUnitSchema>;
