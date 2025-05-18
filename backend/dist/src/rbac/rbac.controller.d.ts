interface AuthRequest extends Request {
    user: {
        userId: number;
        email: string;
        role: string;
    };
}
export declare class RbacController {
    getAdminResource(req: AuthRequest): {
        message: string;
    };
    getOrganizerResource(req: AuthRequest): {
        message: string;
    };
    getStaffResource(req: AuthRequest): {
        message: string;
    };
    getAuthenticatedResource(): {
        message: string;
    };
}
export {};
