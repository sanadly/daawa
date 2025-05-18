import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
export declare class EventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateEventDto & {
        organizerId: number;
    }): import("generated/prisma").Prisma.Prisma__EventClient<{
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
    findOne(id: number): import("generated/prisma").Prisma.Prisma__EventClient<{
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
    update(id: number, data: UpdateEventDto): import("generated/prisma").Prisma.Prisma__EventClient<{
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
    remove(id: number): import("generated/prisma").Prisma.Prisma__EventClient<{
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
