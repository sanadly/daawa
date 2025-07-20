import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

// TypeORM configuration factory
const createDatabaseConfig = (): TypeOrmModuleOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  // Use SQLite for development testing when PostgreSQL is not available
  if (nodeEnv === 'development' && !process.env.DATABASE_HOST) {
    return {
      type: 'sqlite',
      database: ':memory:',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
      entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
    };
  }

  const config: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'daawa',
    password: process.env.DATABASE_PASSWORD || 'Asb1562002',
    database: isTest 
      ? process.env.DATABASE_TEST_NAME || 'daawa'
      : process.env.DATABASE_NAME || 'daawa',
    
    // SSL configuration
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : false,

    // Entity auto-loading
    autoLoadEntities: true,
    
    // Synchronization (only in development/test)
    synchronize: !isProduction && process.env.DATABASE_SYNCHRONIZE !== 'false',
    
    // Logging - only enable in development for debugging
    logging: process.env.DATABASE_LOGGING === 'true' && nodeEnv === 'development',
    logger: 'advanced-console',
    
    // Migration configuration
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'daawa_migrations',
    migrationsRun: isProduction, // Auto-run migrations in production
    
    // Entity configuration
    entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
    
    // Optimized connection pool settings for better performance
    extra: {
      max: parseInt(process.env.DATABASE_POOL_MAX || '20'), // Increased from 10
      min: parseInt(process.env.DATABASE_POOL_MIN || '5'),  // Increased from 2
      acquire: parseInt(process.env.DATABASE_POOL_ACQUIRE_TIMEOUT || '30000'), // Reduced from 60000
      idle: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '10000'),
      // Add connection timeout
      connectionTimeoutMillis: 10000,
      // Add query timeout
      statement_timeout: 30000,
      // Enable connection pooling
      pool: {
        max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
        min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
        acquire: parseInt(process.env.DATABASE_POOL_ACQUIRE_TIMEOUT || '30000'),
        idle: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '10000'),
      },
    },

    // Skip Redis cache for now to avoid connection issues
    // cache: {
    //   type: 'redis',
    //   options: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //     password: process.env.REDIS_PASSWORD,
    //     db: parseInt(process.env.REDIS_CACHE_DB || '1'),
    //   },
    //   duration: 30000, // 30 seconds default cache
    // },
  };

  return config;
};

// Export configuration for NestJS
export default registerAs('database', createDatabaseConfig);

// DataSource for migrations (CLI usage)
const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'daawa',
  password: process.env.DATABASE_PASSWORD || 'Asb1562002',
  database: process.env.DATABASE_NAME || 'daawa',
  
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,

  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'daawa_migrations',
  
  logging: process.env.DATABASE_LOGGING === 'true',
  synchronize: false, // Always false for CLI operations
};

// Export DataSource for CLI
export const AppDataSource = new DataSource(dataSourceOptions);

// Helper function to get connection configuration
export const getDatabaseConfig = createDatabaseConfig; 