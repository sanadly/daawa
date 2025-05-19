import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { JwtPayload } from './types/jwt-payload.interface';
interface AuthenticatedRequest extends Express.Request {
    user: JwtPayload;
}
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        id: number;
        email: string;
        role: import("generated/prisma").$Enums.Role;
    }>;
    login(req: any, loginDto: LoginUserDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            roles: any[];
        };
    }>;
    loginDirect(loginDto: LoginUserDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            roles: any[];
        };
    }>;
    refreshToken(req: AuthenticatedRequest, authHeader: string): Promise<import("./auth.service").Tokens>;
    logout(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    getProfile(req: AuthenticatedRequest): JwtPayload;
    verifyEmail(token: string): Promise<{
        message: string;
        user?: {
            id: number;
            email: string;
            role: import("generated/prisma").$Enums.Role;
        };
    }>;
    resendVerificationEmailController(resendVerificationEmailDto: ResendVerificationEmailDto): Promise<{
        message: string;
    }>;
    forgotPasswordController(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPasswordController(body: {
        token: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
export {};
