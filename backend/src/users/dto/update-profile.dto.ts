import { IsOptional, IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  language?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword?: string;
} 