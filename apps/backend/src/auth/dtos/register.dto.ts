import { IsEmail, IsString, MinLength, MaxLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../database/entities/user.entity';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  )
  password: string;

  @IsString()
  @MinLength(8, { message: 'Password confirmation must be at least 8 characters long' })
  confirmPassword: string;

  @IsEnum(UserRole, { message: 'Role must be one of: admin, organizer, staff' })
  role: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Language must be at least 2 characters' })
  @MaxLength(5, { message: 'Language must not exceed 5 characters' })
  preferred_language?: string = 'en';

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  @Matches(/^[+]?[1-9][\d\s\-()]+$/, { message: 'Please provide a valid phone number' })
  phone?: string;
} 