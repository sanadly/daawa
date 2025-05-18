import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(createEventDto: CreateEventDto, req: any): import("generated/prisma").Prisma.Prisma__EventClient<{
        id: number;
        language: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        dateTime: Date;
        location: string | null;
        type: import("generated/prisma").$Enums.EventType;
        state: string;
        expectedGuests: number | null;
        organizerId: number;
    }, never, import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
    findAll(): import("generated/prisma").Prisma.PrismaPromise<{
        id: number;
        language: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        dateTime: Date;
        location: string | null;
        type: import("generated/prisma").$Enums.EventType;
        state: string;
        expectedGuests: number | null;
        organizerId: number;
    }[]>;
    findOne(id: string): import("generated/prisma").Prisma.Prisma__EventClient<{
        id: number;
        language: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        dateTime: Date;
        location: string | null;
        type: import("generated/prisma").$Enums.EventType;
        state: string;
        expectedGuests: number | null;
        organizerId: number;
    } | null, null, import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
    update(id: string, updateEventDto: UpdateEventDto): import("generated/prisma").Prisma.Prisma__EventClient<{
        id: number;
        language: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        dateTime: Date;
        location: string | null;
        type: import("generated/prisma").$Enums.EventType;
        state: string;
        expectedGuests: number | null;
        organizerId: number;
    }, never, import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
    remove(id: string): import("generated/prisma").Prisma.Prisma__EventClient<{
        id: number;
        language: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        dateTime: Date;
        location: string | null;
        type: import("generated/prisma").$Enums.EventType;
        state: string;
        expectedGuests: number | null;
        organizerId: number;
    }, never, import("generated/prisma/runtime/library").DefaultArgs, import("generated/prisma").Prisma.PrismaClientOptions>;
}
