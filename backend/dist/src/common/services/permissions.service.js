"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../decorators/roles.decorator");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
let PermissionsService = class PermissionsService {
    permissionGroups = {
        eventBasic: [permissions_decorator_1.Permission.VIEW_EVENTS],
        eventManagement: [
            permissions_decorator_1.Permission.MANAGE_EVENTS,
            permissions_decorator_1.Permission.CREATE_EVENT,
            permissions_decorator_1.Permission.UPDATE_EVENT,
            permissions_decorator_1.Permission.DELETE_EVENT,
        ],
        attendeeManagement: [
            permissions_decorator_1.Permission.MANAGE_ATTENDEES,
            permissions_decorator_1.Permission.VIEW_ATTENDEES,
            permissions_decorator_1.Permission.CHECK_IN_ATTENDEE,
        ],
        analytics: [permissions_decorator_1.Permission.VIEW_ANALYTICS, permissions_decorator_1.Permission.VIEW_REPORTS],
        adminCore: [
            permissions_decorator_1.Permission.MANAGE_USERS,
            permissions_decorator_1.Permission.CONFIGURE_SYSTEM,
            permissions_decorator_1.Permission.VIEW_LOGS,
        ],
        supportTicket: [
            permissions_decorator_1.Permission.CREATE_SUPPORT_TICKET,
            permissions_decorator_1.Permission.VIEW_SUPPORT_TICKETS,
            permissions_decorator_1.Permission.UPDATE_SUPPORT_TICKET,
            permissions_decorator_1.Permission.DELETE_SUPPORT_TICKET,
        ],
    };
    rolePermissionsMap = new Map([
        [
            roles_decorator_1.Role.ADMIN,
            [
                ...this.permissionGroups.adminCore,
                ...this.permissionGroups.eventManagement,
                ...this.permissionGroups.attendeeManagement,
                ...this.permissionGroups.analytics,
                ...this.permissionGroups.supportTicket,
                permissions_decorator_1.Permission.MANAGE_STAFF,
                permissions_decorator_1.Permission.MANAGE_TASKS,
                permissions_decorator_1.Permission.SEND_NOTIFICATIONS,
            ],
        ],
        [
            roles_decorator_1.Role.ORGANIZER,
            [
                ...this.permissionGroups.eventManagement,
                ...this.permissionGroups.attendeeManagement,
                ...this.permissionGroups.analytics,
                permissions_decorator_1.Permission.MANAGE_STAFF,
                permissions_decorator_1.Permission.READ_PROFILE,
                permissions_decorator_1.Permission.UPDATE_PROFILE,
                permissions_decorator_1.Permission.SEND_NOTIFICATIONS,
            ],
        ],
        [
            roles_decorator_1.Role.STAFF,
            [
                ...this.permissionGroups.eventBasic,
                permissions_decorator_1.Permission.MANAGE_TASKS,
                permissions_decorator_1.Permission.VIEW_ATTENDEES,
                permissions_decorator_1.Permission.CHECK_IN_ATTENDEE,
                permissions_decorator_1.Permission.READ_PROFILE,
                permissions_decorator_1.Permission.CREATE_SUPPORT_TICKET,
            ],
        ],
        [
            roles_decorator_1.Role.USER,
            [
                permissions_decorator_1.Permission.READ_PROFILE,
                permissions_decorator_1.Permission.UPDATE_PROFILE,
                permissions_decorator_1.Permission.CREATE_SUPPORT_TICKET,
            ],
        ],
    ]);
    getPermissionsForRole(role) {
        return this.rolePermissionsMap.get(role) || [];
    }
    getAllPermissionsForRoles(roles) {
        const allPermissions = roles.flatMap((role) => this.getPermissionsForRole(role));
        return [...new Set(allPermissions)];
    }
    hasPermission(userRoles, requiredPermissions) {
        const userPermissions = this.getAllPermissionsForRoles(userRoles);
        return requiredPermissions.every((permission) => userPermissions.includes(permission));
    }
    hasAnyPermission(userRoles, permissions) {
        const userPermissions = this.getAllPermissionsForRoles(userRoles);
        return permissions.some((permission) => userPermissions.includes(permission));
    }
    hasPermissionGroup(userRoles, groupName) {
        const groupPermissions = this.permissionGroups[groupName];
        if (!groupPermissions)
            return false;
        return this.hasPermission(userRoles, groupPermissions);
    }
    canAccessOwnedResource(userRoles, resourceOwnerId, userId, ownerPermission, adminPermission) {
        if (resourceOwnerId === userId &&
            this.hasPermission(userRoles, [ownerPermission])) {
            return true;
        }
        return this.hasPermission(userRoles, [adminPermission]);
    }
    getPermissionGroups() {
        return { ...this.permissionGroups };
    }
    getPermissionsForGroup(groupName) {
        return this.permissionGroups[groupName] || [];
    }
    getAllAvailablePermissions() {
        return Object.values(permissions_decorator_1.Permission);
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)()
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map