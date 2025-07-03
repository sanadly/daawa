import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { User } from '../../database/entities/user.entity';
import { UserActivity, ActivityType } from '../../database/entities/user-activity.entity';
import { PasswordHistory } from '../../database/entities/password-history.entity';

export interface PasswordSecurityConfig {
  algorithm: 'bcrypt' | 'argon2';
  bcryptRounds: number;
  argon2Options: {
    type: 0 | 1 | 2;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
  passwordHistoryCount: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  requirePeriodicChange: boolean;
  passwordExpiryDays: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  entropy: number;
  estimatedCrackTime: string;
}

export interface PasswordSecurityReport {
  userId: string;
  lastPasswordChange: Date | null;
  failedAttempts: number;
  isLocked: boolean;
  lockoutExpiry: Date | null;
  passwordAge: number;
  requiresChange: boolean;
  securityScore: number;
}

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly config: PasswordSecurityConfig;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,
  ) {
    this.config = {
      algorithm: (process.env.PASSWORD_ALGORITHM as 'bcrypt' | 'argon2') || 'argon2',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      argon2Options: {
        type: 2, // argon2id
        memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536'), // 64 MB
        timeCost: parseInt(process.env.ARGON2_TIME_COST || '3'),
        parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4'),
      },
      passwordHistoryCount: parseInt(process.env.PASSWORD_HISTORY_COUNT || '5'),
      maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
      lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30'),
      requirePeriodicChange: process.env.REQUIRE_PERIODIC_CHANGE === 'true',
      passwordExpiryDays: parseInt(process.env.PASSWORD_EXPIRY_DAYS || '90'),
    };
  }

  /**
   * Hash a plain text password using the configured algorithm
   */
  async hashPassword(password: string): Promise<string> {
    try {
      if (this.config.algorithm === 'argon2') {
        return await argon2.hash(password, this.config.argon2Options);
      } else {
        const salt = await bcrypt.genSalt(this.config.bcryptRounds);
        return await bcrypt.hash(password, salt);
      }
    } catch (error) {
      this.logger.error('Password hashing failed', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      // Detect algorithm based on hash format
      if (hashedPassword.startsWith('$argon2')) {
        return await argon2.verify(hashedPassword, password);
      } else {
        return await bcrypt.compare(password, hashedPassword);
      }
    } catch (error) {
      this.logger.error('Password comparison failed', error);
      return false;
    }
  }

  /**
   * Enhanced password strength validation with entropy calculation
   */
  validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;
    const entropy = this.calculateEntropy(password);

    // Length check (enhanced)
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 16) {
      score += 3;
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    const checks = [
      { regex: /[A-Z]/, message: 'Password must contain at least one uppercase letter', points: 1 },
      { regex: /[a-z]/, message: 'Password must contain at least one lowercase letter', points: 1 },
      { regex: /\d/, message: 'Password must contain at least one number', points: 1 },
      { regex: /[@$!%*?&#+\-=<>(){}[\]|\\:";',./~`^_]/, message: 'Password must contain at least one special character', points: 1 },
    ];

    for (const check of checks) {
      if (check.regex.test(password)) {
        score += check.points;
      } else {
        errors.push(check.message);
      }
    }

    // Advanced pattern checks
    if (this.hasRepeatingPatterns(password)) {
      errors.push('Password contains repeating patterns');
      score = Math.max(0, score - 2);
    }

    if (this.hasSequentialPatterns(password)) {
      errors.push('Password contains sequential patterns (abc, 123)');
      score = Math.max(0, score - 1);
    }

    if (this.hasCommonPasswords(password)) {
      errors.push('Password is too common and easily guessable');
      score = Math.max(0, score - 3);
    }

    if (this.hasKeyboardPatterns(password)) {
      errors.push('Password contains keyboard patterns');
      score = Math.max(0, score - 1);
    }

    // Entropy bonus
    if (entropy >= 60) {
      score += 2;
    } else if (entropy >= 40) {
      score += 1;
    }

    const finalScore = Math.min(10, Math.max(0, score));
    
    return {
      isValid: errors.length === 0 && finalScore >= 6,
      errors,
      score: finalScore,
      strength: this.getStrengthLabel(finalScore),
      entropy,
      estimatedCrackTime: this.estimateCrackTime(entropy),
    };
  }

  /**
   * Check if password has been used before
   */
  async isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
    try {
      // Get user's recent password history
      const passwordHistory = await this.passwordHistoryRepository.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        take: this.config.passwordHistoryCount,
      });

      // Check if new password matches any in history
      for (const historyRecord of passwordHistory) {
        const isMatch = await this.comparePassword(newPassword, historyRecord.password_hash);
        if (isMatch) {
          return true; // Password has been used before
        }
      }

      return false; // Password is not in history
    } catch (error) {
      this.logger.error('Password reuse check failed', error);
      return false;
    }
  }

  /**
   * Store password in history after successful change
   */
  async storePasswordInHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      // Determine algorithm from hash format
      const algorithm = passwordHash.startsWith('$argon2') ? 'argon2id' : 'bcrypt';

      // Create new password history record
      const historyRecord = this.passwordHistoryRepository.create({
        user_id: userId,
        password_hash: passwordHash,
        algorithm,
      });

      await this.passwordHistoryRepository.save(historyRecord);

      // Clean up old password history records (keep only the configured number)
      const allHistory = await this.passwordHistoryRepository.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      });

      if (allHistory.length > this.config.passwordHistoryCount) {
        const recordsToDelete = allHistory.slice(this.config.passwordHistoryCount);
        await this.passwordHistoryRepository.remove(recordsToDelete);
      }
    } catch (error) {
      this.logger.error('Failed to store password in history', error);
      // Don't throw error as this shouldn't block password change
    }
  }

  /**
   * Get password security report for a user
   */
  async getPasswordSecurityReport(userId: string): Promise<PasswordSecurityReport> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Get recent failed login attempts
    const failedAttempts = await this.activityRepository.count({
      where: {
        user_id: userId,
        activity_type: ActivityType.FAILED_LOGIN,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    });

    // Get last password change
    const lastPasswordChange = await this.activityRepository.findOne({
      where: {
        user_id: userId,
        activity_type: ActivityType.PASSWORD_CHANGE,
      },
      order: { created_at: 'DESC' },
    });

    const passwordAge = lastPasswordChange 
      ? Math.floor((Date.now() - lastPasswordChange.created_at.getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24));

    const isLocked = failedAttempts >= this.config.maxFailedAttempts;
    const requiresChange = this.config.requirePeriodicChange && passwordAge > this.config.passwordExpiryDays;

    return {
      userId,
      lastPasswordChange: lastPasswordChange?.created_at || null,
      failedAttempts,
      isLocked,
      lockoutExpiry: isLocked ? new Date(Date.now() + this.config.lockoutDurationMinutes * 60 * 1000) : null,
      passwordAge,
      requiresChange,
      securityScore: this.calculateSecurityScore(passwordAge, failedAttempts, isLocked),
    };
  }

  /**
   * Generate a cryptographically secure password
   */
  generateSecurePassword(length: number = 16, options?: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
  }): string {
    const opts = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: false,
      ...options,
    };

    let lowercase = 'abcdefghijklmnopqrstuvwxyz';
    let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numbers = '0123456789';
    let symbols = '@$!%*?&#+\-=<>(){}[]|\\:";\',.~`^_';

    if (opts.excludeSimilar) {
      lowercase = lowercase.replace(/[il]/g, '');
      uppercase = uppercase.replace(/[IL]/g, '');
      numbers = numbers.replace(/[01]/g, '');
      symbols = symbols.replace(/[|\\]/g, '');
    }

    let charSet = '';
    const guaranteedChars: string[] = [];

    if (opts.includeLowercase) {
      charSet += lowercase;
      guaranteedChars.push(lowercase[crypto.randomInt(lowercase.length)]);
    }
    if (opts.includeUppercase) {
      charSet += uppercase;
      guaranteedChars.push(uppercase[crypto.randomInt(uppercase.length)]);
    }
    if (opts.includeNumbers) {
      charSet += numbers;
      guaranteedChars.push(numbers[crypto.randomInt(numbers.length)]);
    }
    if (opts.includeSymbols) {
      charSet += symbols;
      guaranteedChars.push(symbols[crypto.randomInt(symbols.length)]);
    }

    if (charSet.length === 0) {
      throw new Error('At least one character type must be enabled');
    }

    // Generate remaining characters
    const remainingLength = length - guaranteedChars.length;
    const remainingChars: string[] = [];

    for (let i = 0; i < remainingLength; i++) {
      remainingChars.push(charSet[crypto.randomInt(charSet.length)]);
    }

    // Combine and shuffle
    const allChars = [...guaranteedChars, ...remainingChars];
    
    // Fisher-Yates shuffle using crypto.randomInt
    for (let i = allChars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
    }

    return allChars.join('');
  }

  /**
   * Migrate password to newer hashing algorithm
   */
  async migratePasswordHash(userId: string, plainPassword: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if password is already using the current algorithm
    const isCurrentAlgorithm = this.config.algorithm === 'argon2' 
      ? user.password_hash.startsWith('$argon2')
      : !user.password_hash.startsWith('$argon2');

    if (isCurrentAlgorithm) {
      return user.password_hash; // Already using current algorithm
    }

    // Verify current password
    const isValid = await this.comparePassword(plainPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Hash with new algorithm
    const newHash = await this.hashPassword(plainPassword);
    
    // Update user record
    await this.userRepository.update(userId, { password_hash: newHash });
    
    this.logger.log(`Password hash migrated to ${this.config.algorithm} for user ${userId}`);
    
    return newHash;
  }

  // Private helper methods

  private calculateEntropy(password: string): number {
    const charSetSize = this.getCharacterSetSize(password);
    return Math.log2(Math.pow(charSetSize, password.length));
  }

  private getCharacterSetSize(password: string): number {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/\d/.test(password)) size += 10;
    if (/[@$!%*?&#+\-=<>(){}[\]|\\:";',./~`^_]/.test(password)) size += 32;
    return size;
  }

  private hasRepeatingPatterns(password: string): boolean {
    // Check for patterns like "aaa", "111", "!!!"
    return /(.)\1{2,}/.test(password);
  }

  private hasSequentialPatterns(password: string): boolean {
    const sequences = ['abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz',
                      '123', '234', '345', '456', '567', '678', '789', '890'];
    
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq) || lowerPassword.includes(seq.split('').reverse().join('')));
  }

  private hasCommonPasswords(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
      'master', 'shadow', 'superman', 'michael', 'sunshine', 'computer',
    ];
    
    const lowerPassword = password.toLowerCase();
    return commonPasswords.some(common => lowerPassword.includes(common));
  }

  private hasKeyboardPatterns(password: string): boolean {
    const patterns = ['qwerty', 'asdf', 'zxcv', '1234', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const lowerPassword = password.toLowerCase();
    return patterns.some(pattern => lowerPassword.includes(pattern));
  }

  private getStrengthLabel(score: number): 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' {
    if (score >= 9) return 'strong';
    if (score >= 7) return 'good';
    if (score >= 5) return 'fair';
    if (score >= 3) return 'weak';
    return 'very-weak';
  }

  private estimateCrackTime(entropy: number): string {
    const guessesPerSecond = 1e12; // 1 trillion guesses per second (optimistic for attackers)
    const secondsToGuess = Math.pow(2, entropy - 1) / guessesPerSecond;
    
    if (secondsToGuess < 60) return 'Less than a minute';
    if (secondsToGuess < 3600) return `${Math.floor(secondsToGuess / 60)} minutes`;
    if (secondsToGuess < 86400) return `${Math.floor(secondsToGuess / 3600)} hours`;
    if (secondsToGuess < 31536000) return `${Math.floor(secondsToGuess / 86400)} days`;
    if (secondsToGuess < 31536000000) return `${Math.floor(secondsToGuess / 31536000)} years`;
    return 'Centuries';
  }

  private calculateSecurityScore(passwordAge: number, failedAttempts: number, isLocked: boolean): number {
    let score = 100;
    
    // Deduct points for old passwords
    if (passwordAge > this.config.passwordExpiryDays) {
      score -= Math.min(30, (passwordAge - this.config.passwordExpiryDays) * 2);
    }
    
    // Deduct points for failed attempts
    score -= failedAttempts * 5;
    
    // Major deduction if locked
    if (isLocked) {
      score -= 40;
    }
    
    return Math.max(0, Math.min(100, score));
  }
} 