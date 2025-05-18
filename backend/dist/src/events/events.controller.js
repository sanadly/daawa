"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
class EventDto {
    title;
    description;
    dateTime;
    location;
}
let EventsController = class EventsController {
    async getAllEvents() {
        const events = await Promise.resolve([
            {
                id: 1,
                title: 'Community Gathering',
                dateTime: new Date(),
                location: 'Main Hall',
            },
            {
                id: 2,
                title: 'Weekly Study Circle',
                dateTime: new Date(),
                location: 'Room 102',
            },
        ]);
        return {
            message: 'List of all events',
            events,
        };
    }
    async getEventById(id) {
        const event = await Promise.resolve({
            id: parseInt(id),
            title: 'Community Gathering',
            description: 'A weekly gathering for the community',
            dateTime: new Date(),
            location: 'Main Hall',
            organizerId: 3,
        });
        return {
            message: `Event details for ID: ${id}`,
            event,
        };
    }
    async createEvent(eventDto, req) {
        const createdEvent = await Promise.resolve({
            id: 3,
            ...eventDto,
            organizerId: req.user.userId,
        });
        return {
            message: 'Event created successfully',
            createdBy: req.user.username,
            role: req.user.role,
            event: createdEvent,
        };
    }
    async updateEvent(id, eventDto, req) {
        const updatedEvent = await Promise.resolve({
            id: parseInt(id),
            ...eventDto,
            organizerId: req.user.userId,
        });
        return {
            message: `Event with ID: ${id} updated successfully`,
            updatedBy: req.user.username,
            role: req.user.role,
            event: updatedEvent,
        };
    }
    async deleteEvent(id, req) {
        await Promise.resolve(true);
        return {
            message: `Event with ID: ${id} deleted successfully`,
            deletedBy: req.user.username,
            role: req.user.role,
        };
    }
    async getEventRegistrations(id, req) {
        const registrations = await Promise.resolve([
            { userId: 101, name: 'John Doe', email: 'john@example.com' },
            { userId: 102, name: 'Jane Smith', email: 'jane@example.com' },
        ]);
        return {
            message: `Registrations for event ID: ${id}`,
            accessedBy: req.user.username,
            role: req.user.role,
            registrations,
        };
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getAllEvents", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ORGANIZER, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [EventDto, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ORGANIZER, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, EventDto, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "deleteEvent", null);
__decorate([
    (0, common_1.Get)(':id/registrations'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.STAFF, role_enum_1.Role.ORGANIZER, role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventRegistrations", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)('events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard)
], EventsController);
//# sourceMappingURL=events.controller.js.map