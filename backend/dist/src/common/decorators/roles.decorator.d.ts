export declare enum Role {
    USER = "USER",
    STAFF = "STAFF",
    ORGANIZER = "ORGANIZER",
    ADMIN = "ADMIN"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
