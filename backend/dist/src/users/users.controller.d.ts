import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
interface RequestWithUser extends Express.Request {
    user: {
        sub: number;
        email: string;
        role: string;
    };
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: RequestWithUser): Promise<{
        id: number;
        email: string;
        name: string | null;
        language: string;
        role: import("generated/prisma").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
        isEmailVerified: boolean;
    }>;
    updateProfile(req: RequestWithUser, updateProfileDto: UpdateProfileDto): Promise<{
        id: number;
        email: string;
        name: string | null;
        language: string;
        role: import("generated/prisma").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
        isEmailVerified: boolean;
    }>;
}
export {};
