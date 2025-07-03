import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from root directory
config({ path: '../../.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'daawa_development',
  
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,

  entities: [join(__dirname, 'src/database/entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'src/database/migrations', '*.{ts,js}')],
  migrationsTableName: 'daawa_migrations',
  
  logging: process.env.DATABASE_LOGGING === 'true',
  synchronize: false, // Always false for CLI operations
}); 