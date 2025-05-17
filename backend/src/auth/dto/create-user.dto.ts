import { IsString, MinLength, IsEmail, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6) // Example: require a minimum password length
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(1) // Optional: Add MinLength if name is provided
  name?: string;
} 