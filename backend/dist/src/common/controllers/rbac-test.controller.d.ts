import { Role } from '../decorators/roles.decorator';
interface RequestWithUser extends Request {
    user: {
        userId: number;
        username: string;
        roles: Role[];
    };
}
export declare class RbacTestController {
    public(): string;
    authenticated(req: RequestWithUser): any;
    staffAccess(req: RequestWithUser): any;
    organizerAccess(req: RequestWithUser): any;
    adminAccess(req: RequestWithUser): any;
    viewEventsAccess(req: RequestWithUser): any;
    manageEventsAccess(req: RequestWithUser): any;
    adminOperationsAccess(req: RequestWithUser): any;
    combinedAuthAccess(req: RequestWithUser): any;
}
export {};
