import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter, log: ['warn', 'error'] });
    this.pool = pool;
  }

  async onModuleInit() {
    // Verify DB connectivity on startup
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Database connection established');
    } catch (err) {
      this.logger.error('Failed to connect to database', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
