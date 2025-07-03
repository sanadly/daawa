# Password Security Configuration

## Overview

The enhanced password security system provides enterprise-grade password protection with configurable algorithms, validation rules, and security policies.

## Environment Variables

Add these to your `.env` file to configure password security:

### Algorithm Selection
```
# Choose hashing algorithm: 'bcrypt' or 'argon2' (default: argon2)
PASSWORD_ALGORITHM=argon2
```

### bcrypt Configuration (if using bcrypt)
```
BCRYPT_ROUNDS=12  # Salt rounds (higher = more secure but slower)
```

### Argon2 Configuration (if using argon2)
```
ARGON2_MEMORY_COST=65536  # Memory usage in KB (64 MB)
ARGON2_TIME_COST=3        # Time iterations
ARGON2_PARALLELISM=4      # Number of parallel threads
```

### Password Policy
```
PASSWORD_HISTORY_COUNT=5          # Number of previous passwords to remember
MAX_FAILED_ATTEMPTS=5             # Failed attempts before account lockout
LOCKOUT_DURATION_MINUTES=30       # Lockout duration in minutes
REQUIRE_PERIODIC_CHANGE=false     # Require periodic password changes
PASSWORD_EXPIRY_DAYS=90           # Password expiration in days
```

## Security Features

### 1. **Dual Algorithm Support**
- **Argon2id** (recommended): Winner of the Password Hashing Competition
- **bcrypt**: Widely supported legacy algorithm
- Automatic algorithm detection for existing passwords
- Seamless migration between algorithms

### 2. **Enhanced Password Validation**
- **Minimum Requirements**: 8+ characters, mixed case, numbers, special characters
- **Pattern Detection**: Prevents common patterns, sequences, keyboard walks
- **Entropy Calculation**: Mathematical strength measurement
- **Crack Time Estimation**: Real-world attack resistance estimates
- **Dictionary Checking**: Prevents common passwords

### 3. **Password History Tracking**
- Configurable history count (default: 5 passwords)
- Prevents password reuse
- Secure hash storage with algorithm tagging
- Automatic cleanup of old records

### 4. **Account Security Monitoring**
- Failed login attempt tracking
- Automatic account lockouts
- Configurable lockout duration
- Activity logging with IP/User Agent
- Security score calculation

### 5. **Password Lifecycle Management**
- Optional periodic password expiration
- Secure password generation
- Migration tools for algorithm updates
- Comprehensive security reports

## API Endpoints

### Password Security Controller
Base URL: `/auth/password-security`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/validate` | POST | Validate password strength | Yes |
| `/generate` | POST | Generate secure password | Yes |
| `/check-reuse` | POST | Check password reuse | Yes |
| `/security-report` | GET | Get security report | Yes |
| `/security-report/:userId` | GET | Get user security report (Admin) | Yes + Permissions |
| `/migrate-hash/:userId` | POST | Migrate password algorithm (Admin) | Yes + Permissions |
| `/config` | GET | Get security configuration (Admin) | Yes + Permissions |

## Example Usage

### Password Validation
```javascript
const validation = await passwordService.validatePasswordStrength('MySecureP@ssw0rd!');
console.log(validation);
// {
//   isValid: true,
//   errors: [],
//   score: 8,
//   strength: 'good',
//   entropy: 52.6,
//   estimatedCrackTime: '3 years'
// }
```

### Generate Secure Password
```javascript
const password = passwordService.generateSecurePassword(16, {
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: true
});
```

### Security Report
```javascript
const report = await passwordService.getPasswordSecurityReport(userId);
console.log(report);
// {
//   userId: '123e4567-e89b-12d3-a456-426614174000',
//   lastPasswordChange: '2024-01-15T10:30:00Z',
//   failedAttempts: 0,
//   isLocked: false,
//   passwordAge: 15,
//   requiresChange: false,
//   securityScore: 95
// }
```

## Security Recommendations

### Production Configuration
```
PASSWORD_ALGORITHM=argon2
ARGON2_MEMORY_COST=131072     # 128 MB for production
ARGON2_TIME_COST=4            # Increase time cost
PASSWORD_HISTORY_COUNT=8      # More password history
MAX_FAILED_ATTEMPTS=3         # Stricter lockout
LOCKOUT_DURATION_MINUTES=60   # Longer lockouts
REQUIRE_PERIODIC_CHANGE=true  # Enable expiration
PASSWORD_EXPIRY_DAYS=60       # Shorter expiry period
```

### High-Security Environment
```
PASSWORD_ALGORITHM=argon2
ARGON2_MEMORY_COST=262144     # 256 MB
ARGON2_TIME_COST=6            # Maximum time cost
PASSWORD_HISTORY_COUNT=12     # Extensive history
MAX_FAILED_ATTEMPTS=3         # Immediate lockout
LOCKOUT_DURATION_MINUTES=120  # 2-hour lockouts
REQUIRE_PERIODIC_CHANGE=true
PASSWORD_EXPIRY_DAYS=30       # Monthly changes
```

## Migration Guide

### From Basic Authentication
1. Update environment variables
2. Run database migration
3. Existing passwords continue to work
4. New passwords use enhanced security
5. Gradual migration on login

### Algorithm Migration
1. Set new `PASSWORD_ALGORITHM`
2. Use `/migrate-hash` endpoint for immediate migration
3. Or allow natural migration on user login
4. Monitor migration progress via security reports

## Monitoring and Alerts

### Key Metrics
- Password strength distribution
- Failed login patterns
- Account lockout frequency
- Password age statistics
- Algorithm usage breakdown

### Security Events
- Multiple failed logins
- Account lockouts
- Password reuse attempts
- Weak password attempts
- Algorithm migrations

## Troubleshooting

### Performance Issues
- Reduce `ARGON2_MEMORY_COST` if memory constrained
- Reduce `ARGON2_TIME_COST` if CPU constrained
- Monitor authentication response times

### User Experience
- Provide clear password requirements
- Implement progressive enhancement
- Show password strength meters
- Guide users to secure passwords

### Security Balance
- Balance security with usability
- Consider organizational requirements
- Monitor user feedback
- Adjust policies as needed 