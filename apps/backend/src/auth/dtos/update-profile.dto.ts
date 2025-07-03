import {
  IsString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 5)
  @Matches(/^[a-z]{2,5}$/, {
    message: 'Language code must be lowercase letters only (e.g., "en", "es")',
  })
  preferred_language?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Length(8, 128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    },
  )
  newPassword: string;
}

export class UpdateAccountSettingsDto {
  @IsOptional()
  @IsString()
  @Length(2, 5)
  preferred_language?: string;

  @IsOptional()
  @IsString()
  notifications_email?: boolean;

  @IsOptional()
  @IsString()
  notifications_sms?: boolean;

  @IsOptional()
  @IsString()
  two_factor_enabled?: boolean;
} 