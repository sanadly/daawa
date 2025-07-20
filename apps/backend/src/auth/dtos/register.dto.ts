import { IsEmail, IsString, MinLength, MaxLength, IsEnum, IsOptional, Matches, IsUrl, ValidateIf, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole, AccountType } from '../../database/entities/user.entity';

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

  @IsEnum(UserRole, { message: 'Role must be one of: admin, company_organizer, individual_organizer, staff' })
  role: UserRole;

  @IsEnum(AccountType, { message: 'Account type must be one of: individual, company' })
  account_type: AccountType;

  // Company-specific fields (required if account_type is company)
  @ValidateIf(o => o.account_type === AccountType.COMPANY)
  @IsString()
  @MinLength(2, { message: 'Company name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  company_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Company registration number must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  company_registration_number?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid company website URL' })
  @MaxLength(255, { message: 'Company website must not exceed 255 characters' })
  company_website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Company address must not exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  company_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Job title must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  job_title?: string;

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

  @IsOptional()
  @IsString()
  managing_organization_id?: string;

  @IsOptional()
  @IsString()
  company_location?: string;

  @IsOptional()
  @IsString()
  company_description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  company_events_per_month?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  company_staff_needed?: number;
} 