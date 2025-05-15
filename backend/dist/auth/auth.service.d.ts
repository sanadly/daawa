import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
type UserData = Pick<User, 'id' | 'username' | 'email'>;
export interface Tokens {
    access_token: string;
    refresh_token: string;
}
export interface LoginResponse extends Tokens {
    user: UserData;
}
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    validateUser(username: string, pass: string): Promise<UserData | null>;
    private getTokens;
    login(user: UserData): Promise<LoginResponse>;
    register(createUserDto: Pick<User, 'username' | 'password' | 'email'>): Promise<UserData | null>;
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
}
export {};
