import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  readonly refreshToken!: string; // Added definite assignment assertion
} 