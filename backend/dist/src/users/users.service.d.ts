import { PrismaService } from '../prisma/prisma.service';
import { User, PasswordResetToken } from '../../generated/prisma';
export interface CreateUserInput {
    email: string;
    password: string;
    name?: string | null;
    emailVerificationToken?: string | null;
    isEmailVerified: boolean;
}
export interface UpdateProfileInput {
    email?: string;
    name?: string;
    language?: string;
    password?: string;
}
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOneByEmail(email: string): Promise<User | null>;
    findOneById(id: number): Promise<User | null>;
    create(data: CreateUserInput): Promise<User>;
    updateProfile(userId: number, data: UpdateProfileInput): Promise<User>;
    setCurrentRefreshToken(refreshToken: string | null, userId: number): Promise<void>;
    getUserIfRefreshTokenMatches(refreshToken: string, userId: number): Promise<User | null>;
    findOneByEmailVerificationToken(token: string): Promise<User | null>;
    setEmailVerified(userId: number): Promise<User>;
    updateEmailVerificationToken(userId: number, newToken: string): Promise<User>;
    updatePassword(userId: number, newPasswordHash: string): Promise<User>;
    createPasswordResetToken(userId: number, token: string, expires: Date): Promise<PasswordResetToken>;
    findUserByPasswordResetToken(tokenValue: string): Promise<User | null>;
    clearPasswordResetTokensForUser(userId: number): Promise<void>;
}
