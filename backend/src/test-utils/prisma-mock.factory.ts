/**
 * Reusable Prisma mock factory for unit tests.
 * Creates a deep mock of PrismaService with jest.fn() stubs
 * for all model methods used across the codebase.
 */
export function createPrismaMock() {
  return {
    $transaction: jest.fn(),
    property: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
    },
    building: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    unit: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
    },
    sourceDocument: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    aiExtractionJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
