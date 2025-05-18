import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User as PrismaUser } from '../../generated/prisma';
import { EmailService } from '../email/email.service';
type UserData = Pick<PrismaUser, 'id' | 'email' | 'role'>;
export interface Tokens {
    access_token: string;
    refresh_token: string;
}
export interface LoginResponse extends Tokens {
    user: UserData;
}
export interface AuthRegisterDto {
    email: string;
    password: string;
    name?: string;
}
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    validateUser(emailInput: string, pass: string): Promise<UserData | null>;
    private getTokens;
    login(user: UserData): Promise<LoginResponse>;
    register(authRegisterDto: AuthRegisterDto): Promise<UserData>;
    refreshToken(userId: number, rt: string): Promise<Tokens>;
    logout(userId: number): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
        user?: UserData;
    }>;
    resendVerificationEmail(email: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
export {};
