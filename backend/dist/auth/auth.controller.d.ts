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
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        username: string;
        email: string;
        id: number;
    } | null>;
    login(loginUserDto: LoginUserDto): Promise<import("./auth.service").LoginResponse>;
    refreshToken(req: AuthenticatedRequest, authHeader: string): Promise<import("./auth.service").Tokens>;
    logout(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    getProfile(req: AuthenticatedRequest): JwtPayload;
    verifyEmail(token: string): Promise<{
        message: string;
        user?: {
            username: string;
            email: string;
            id: number;
        };
    }>;
    resendVerificationEmailController(resendVerificationEmailDto: ResendVerificationEmailDto): Promise<{
        message: string;
    }>;
}
export {};
