export declare class User {
    id: number;
    username: string;
    email: string;
    password: string;
    hashedRefreshToken?: string | null;
    isEmailVerified: boolean;
    emailVerificationToken?: string | null;
    hashPassword(): Promise<void>;
}
