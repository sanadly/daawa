import { Role } from '../common/enums/role.enum';
interface RequestWithUser extends Request {
    user: {
        userId: number;
        username: string;
        role: Role;
    };
}
declare class EventDto {
    title: string;
    description: string;
    dateTime: Date;
    location: string;
}
export declare class EventsController {
    getAllEvents(): Promise<{
        message: string;
        events: {
            id: number;
            title: string;
            dateTime: Date;
            location: string;
        }[];
    }>;
    getEventById(id: string): Promise<{
        message: string;
        event: {
            id: number;
            title: string;
            description: string;
            dateTime: Date;
            location: string;
            organizerId: number;
        };
    }>;
    createEvent(eventDto: EventDto, req: RequestWithUser): Promise<{
        message: string;
        createdBy: string;
        role: Role;
        event: {
            organizerId: number;
            title: string;
            description: string;
            dateTime: Date;
            location: string;
            id: number;
        };
    }>;
    updateEvent(id: string, eventDto: EventDto, req: RequestWithUser): Promise<{
        message: string;
        updatedBy: string;
        role: Role;
        event: {
            organizerId: number;
            title: string;
            description: string;
            dateTime: Date;
            location: string;
            id: number;
        };
    }>;
    deleteEvent(id: string, req: RequestWithUser): Promise<{
        message: string;
        deletedBy: string;
        role: Role;
    }>;
    getEventRegistrations(id: string, req: RequestWithUser): Promise<{
        message: string;
        accessedBy: string;
        role: Role;
        registrations: {
            userId: number;
            name: string;
            email: string;
        }[];
    }>;
}
export {};
