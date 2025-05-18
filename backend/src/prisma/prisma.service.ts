import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // Log Prisma queries (optional, good for development)
      // log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    // Connect to the database when the module is initialized.
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect from the database when the application shuts down.
    await this.$disconnect();
  }

  // You can add custom methods here if needed, for example, to handle transactions
  // or specific raw queries in a reusable way.
} 