#!/usr/bin/env node

/**
 * Daawa Secrets Manager CLI Tool
 * 
 * This script provides a command-line interface for managing secrets
 * in development, staging, and production environments.
 * 
 * Usage:
 *   node scripts/secrets-manager.js get <key>
 *   node scripts/secrets-manager.js set <key> <value>
 *   node scripts/secrets-manager.js delete <key>
 *   node scripts/secrets-manager.js list
 *   node scripts/secrets-manager.js rotate <key>
 *   node scripts/secrets-manager.js health
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class SecretsManager {
  constructor() {
    this.secretsDir = path.join(process.cwd(), '.secrets');
    this.encryptionKey = process.env.SECRETS_ENCRYPTION_KEY || 'development-key-not-secure';
    
    // Ensure secrets directory exists
    if (!fs.existsSync(this.secretsDir)) {
      fs.mkdirSync(this.secretsDir, { recursive: true });
    }
  }
  
  encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(text) {
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
  
  async getSecret(key) {
    try {
      const filePath = path.join(this.secretsDir, `${key}.enc`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const encryptedContent = fs.readFileSync(filePath, 'utf8');
      return this.decrypt(encryptedContent);
    } catch (error) {
      console.error(`❌ Failed to get secret ${key}: ${error.message}`);
      return null;
    }
  }
  
  async setSecret(key, value) {
    try {
      const filePath = path.join(this.secretsDir, `${key}.enc`);
      const encryptedContent = this.encrypt(value);
      fs.writeFileSync(filePath, encryptedContent);
      console.log(`✅ Secret ${key} saved successfully`);
    } catch (error) {
      console.error(`❌ Failed to set secret ${key}: ${error.message}`);
      throw error;
    }
  }
  
  async deleteSecret(key) {
    try {
      const filePath = path.join(this.secretsDir, `${key}.enc`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Secret ${key} deleted successfully`);
      } else {
        console.log(`⚠️  Secret ${key} not found`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete secret ${key}: ${error.message}`);
      throw error;
    }
  }
  
  async listSecrets() {
    try {
      const files = fs.readdirSync(this.secretsDir);
      const secrets = files
        .filter(file => file.endsWith('.enc'))
        .map(file => file.replace('.enc', ''));
      
      if (secrets.length === 0) {
        console.log('📭 No secrets found');
      } else {
        console.log('🔐 Available secrets:');
        secrets.forEach(secret => {
          console.log(`  - ${secret}`);
        });
      }
      
      return secrets;
    } catch (error) {
      console.error(`❌ Failed to list secrets: ${error.message}`);
      return [];
    }
  }
  
  async rotateSecret(key) {
    try {
      const newValue = crypto.randomBytes(32).toString('base64');
      await this.setSecret(key, newValue);
      console.log(`🔄 Secret ${key} rotated successfully`);
      return newValue;
    } catch (error) {
      console.error(`❌ Failed to rotate secret ${key}: ${error.message}`);
      throw error;
    }
  }
  
  async healthCheck() {
    console.log('🏥 Secrets Manager Health Check');
    console.log('================================');
    
    // Check secrets directory
    const secretsDirExists = fs.existsSync(this.secretsDir);
    console.log(`📁 Secrets directory: ${secretsDirExists ? '✅ OK' : '❌ Not found'}`);
    
    // Check encryption key
    const hasEncryptionKey = !!this.encryptionKey;
    console.log(`🔑 Encryption key: ${hasEncryptionKey ? '✅ OK' : '❌ Not set'}`);
    
    // Test encryption/decryption
    try {
      const testValue = 'test-secret-value';
      const encrypted = this.encrypt(testValue);
      const decrypted = this.decrypt(encrypted);
      const encryptionWorks = decrypted === testValue;
      console.log(`🔐 Encryption/Decryption: ${encryptionWorks ? '✅ OK' : '❌ Failed'}`);
    } catch (error) {
      console.log(`🔐 Encryption/Decryption: ❌ Failed - ${error.message}`);
    }
    
    // List secrets count
    const secrets = await this.listSecrets();
    console.log(`📊 Total secrets: ${secrets.length}`);
    
    // Environment check
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`🌍 Environment: ${nodeEnv}`);
    
    return {
      secretsDirExists,
      hasEncryptionKey,
      secretCount: secrets.length,
      environment: nodeEnv
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const secretsManager = new SecretsManager();
  
  console.log('🔐 Daawa Secrets Manager\n');
  
  switch (command) {
    case 'get':
      if (!args[1]) {
        console.error('❌ Usage: get <key>');
        process.exit(1);
      }
      const value = await secretsManager.getSecret(args[1]);
      if (value !== null) {
        console.log(`🔑 ${args[1]}: ${value}`);
      } else {
        console.log(`⚠️  Secret ${args[1]} not found`);
      }
      break;
      
    case 'set':
      if (!args[1] || !args[2]) {
        console.error('❌ Usage: set <key> <value>');
        process.exit(1);
      }
      await secretsManager.setSecret(args[1], args[2]);
      break;
      
    case 'delete':
      if (!args[1]) {
        console.error('❌ Usage: delete <key>');
        process.exit(1);
      }
      await secretsManager.deleteSecret(args[1]);
      break;
      
    case 'list':
      await secretsManager.listSecrets();
      break;
      
    case 'rotate':
      if (!args[1]) {
        console.error('❌ Usage: rotate <key>');
        process.exit(1);
      }
      const newValue = await secretsManager.rotateSecret(args[1]);
      console.log(`🆕 New value: ${newValue}`);
      break;
      
    case 'health':
      await secretsManager.healthCheck();
      break;
      
    case 'generate':
      const length = parseInt(args[1]) || 32;
      const randomSecret = crypto.randomBytes(length).toString('base64');
      console.log(`🎲 Generated secret: ${randomSecret}`);
      break;
      
    default:
      console.log('📖 Available commands:');
      console.log('  get <key>         - Get a secret value');
      console.log('  set <key> <value> - Set a secret value');
      console.log('  delete <key>      - Delete a secret');
      console.log('  list              - List all secret keys');
      console.log('  rotate <key>      - Generate new value for a secret');
      console.log('  generate [length] - Generate a random secret');
      console.log('  health            - Check secrets manager health');
      console.log('');
      console.log('📝 Examples:');
      console.log('  node scripts/secrets-manager.js set jwt_secret my-secret-key');
      console.log('  node scripts/secrets-manager.js get jwt_secret');
      console.log('  node scripts/secrets-manager.js generate 64');
      break;
  }
}

// Interactive mode for sensitive operations
async function promptForSecret(key) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`Enter value for secret '${key}' (hidden): `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SecretsManager; 