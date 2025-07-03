import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SecretProvider {
  name: string;
  getSecret(key: string): Promise<string | null>;
  setSecret(key: string, value: string): Promise<void>;
  deleteSecret(key: string): Promise<void>;
}

/**
 * AWS Secrets Manager Provider (placeholder implementation)
 */
export class AWSSecretsManagerProvider implements SecretProvider {
  name = 'AWS Secrets Manager';
  
  constructor(private region: string, private credentials?: any) {}
  
  async getSecret(key: string): Promise<string | null> {
    // In a real implementation, you would use AWS SDK
    // const secretsManager = new AWS.SecretsManager({ region: this.region });
    // const result = await secretsManager.getSecretValue({ SecretId: key }).promise();
    // return result.SecretString || null;
    
    Logger.warn('AWS Secrets Manager not implemented - returning null');
    return null;
  }
  
  async setSecret(key: string, value: string): Promise<void> {
    // Implementation for setting secrets in AWS
    Logger.warn('AWS Secrets Manager setSecret not implemented');
  }
  
  async deleteSecret(key: string): Promise<void> {
    // Implementation for deleting secrets in AWS
    Logger.warn('AWS Secrets Manager deleteSecret not implemented');
  }
}

/**
 * HashiCorp Vault Provider (placeholder implementation)
 */
export class VaultProvider implements SecretProvider {
  name = 'HashiCorp Vault';
  
  constructor(private endpoint: string, private token: string) {}
  
  async getSecret(key: string): Promise<string | null> {
    // In a real implementation, you would use node-vault
    // const vault = require('node-vault')({
    //   apiVersion: 'v1',
    //   endpoint: this.endpoint,
    //   token: this.token
    // });
    // const result = await vault.read(`secret/data/${key}`);
    // return result.data.data.value || null;
    
    Logger.warn('HashiCorp Vault not implemented - returning null');
    return null;
  }
  
  async setSecret(key: string, value: string): Promise<void> {
    Logger.warn('HashiCorp Vault setSecret not implemented');
  }
  
  async deleteSecret(key: string): Promise<void> {
    Logger.warn('HashiCorp Vault deleteSecret not implemented');
  }
}

/**
 * File-based encrypted secrets provider for local development
 */
export class FileSecretsProvider implements SecretProvider {
  name = 'File-based Encrypted Secrets';
  private readonly secretsDir: string;
  private readonly encryptionKey: string;
  
  constructor() {
    this.secretsDir = path.join(process.cwd(), '.secrets');
    this.encryptionKey = process.env.SECRETS_ENCRYPTION_KEY || 'development-key-not-secure';
    
    // Ensure secrets directory exists
    if (!fs.existsSync(this.secretsDir)) {
      fs.mkdirSync(this.secretsDir, { recursive: true });
    }
  }
  
  async getSecret(key: string): Promise<string | null> {
    try {
      const filePath = path.join(this.secretsDir, `${key}.enc`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const encryptedContent = fs.readFileSync(filePath, 'utf8');
      return this.decrypt(encryptedContent);
    } catch (error) {
      Logger.error(`Failed to get secret ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }
  
  async setSecret(key: string, value: string): Promise<void> {
    try {
      const filePath = path.join(this.secretsDir, `${key}.enc`);
      const encryptedContent = this.encrypt(value);
      fs.writeFileSync(filePath, encryptedContent);
      Logger.log(`Secret ${key} saved to file`);
    } catch (error) {
      Logger.error(`Failed to set secret ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  async deleteSecret(key: string): Promise<void> {
    try {
      const filePath = path.join(this.secretsDir, `${key}.enc`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        Logger.log(`Secret ${key} deleted`);
      }
    } catch (error) {
      Logger.error(`Failed to delete secret ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  private decrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = text.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

@Injectable()
export class SecretsManagerService {
  private readonly logger = new Logger(SecretsManagerService.name);
  private readonly providers: SecretProvider[] = [];
  
  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }
  
  private initializeProviders(): void {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Initialize providers based on environment
    switch (nodeEnv) {
      case 'production':
        // In production, prefer cloud-based secret managers
        if (process.env.AWS_REGION) {
          this.providers.push(new AWSSecretsManagerProvider(process.env.AWS_REGION));
        }
        if (process.env.VAULT_ENDPOINT && process.env.VAULT_TOKEN) {
          this.providers.push(new VaultProvider(process.env.VAULT_ENDPOINT, process.env.VAULT_TOKEN));
        }
        break;
        
      case 'staging':
        // Staging can use the same providers as production
        if (process.env.VAULT_ENDPOINT && process.env.VAULT_TOKEN) {
          this.providers.push(new VaultProvider(process.env.VAULT_ENDPOINT, process.env.VAULT_TOKEN));
        }
        break;
        
      case 'development':
      default:
        // For development, use file-based provider
        this.providers.push(new FileSecretsProvider());
        break;
    }
    
    this.logger.log(`Initialized ${this.providers.length} secret providers: ${this.providers.map(p => p.name).join(', ')}`);
  }
  
  /**
   * Get a secret from the first available provider
   */
  async getSecret(key: string): Promise<string | null> {
    for (const provider of this.providers) {
      try {
        const secret = await provider.getSecret(key);
        if (secret !== null) {
          this.logger.debug(`Secret ${key} retrieved from ${provider.name}`);
          return secret;
        }
      } catch (error) {
        this.logger.warn(`Failed to get secret ${key} from ${provider.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    this.logger.warn(`Secret ${key} not found in any provider`);
    return null;
  }
  
  /**
   * Set a secret in the first available provider
   */
  async setSecret(key: string, value: string): Promise<void> {
    if (this.providers.length === 0) {
      throw new Error('No secret providers available');
    }
    
    const provider = this.providers[0];
    try {
      await provider.setSecret(key, value);
      this.logger.log(`Secret ${key} saved to ${provider.name}`);
    } catch (error) {
      this.logger.error(`Failed to save secret ${key} to ${provider.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
  
  /**
   * Delete a secret from all providers
   */
  async deleteSecret(key: string): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.deleteSecret(key);
        this.logger.log(`Secret ${key} deleted from ${provider.name}`);
      } catch (error) {
        this.logger.warn(`Failed to delete secret ${key} from ${provider.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  /**
   * Get secret with fallback to environment variable
   */
  async getSecretOrEnv(key: string, envKey?: string): Promise<string | null> {
    // First try to get from secret providers
    const secret = await this.getSecret(key);
    if (secret !== null) {
      return secret;
    }
    
    // Fallback to environment variable
    const envValue = process.env[envKey || key];
    if (envValue) {
      this.logger.debug(`Using environment variable ${envKey || key} as fallback for secret ${key}`);
      return envValue;
    }
    
    return null;
  }
  
  /**
   * Rotate a secret (generate new value and update)
   */
  async rotateSecret(key: string, generator?: () => string): Promise<string> {
    const newValue = generator ? generator() : this.generateRandomSecret();
    await this.setSecret(key, newValue);
    this.logger.log(`Secret ${key} rotated`);
    return newValue;
  }
  
  /**
   * Generate a random secret
   */
  private generateRandomSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }
  
  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<{ provider: string; healthy: boolean; error?: string }[]> {
    const results = [];
    
    for (const provider of this.providers) {
      try {
        // Try to perform a simple operation
        await provider.getSecret('health-check-test');
        results.push({ provider: provider.name, healthy: true });
      } catch (error) {
        results.push({ 
          provider: provider.name, 
          healthy: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return results;
  }
} 