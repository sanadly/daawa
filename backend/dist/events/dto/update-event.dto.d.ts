import { EventType } from './create-event.dto';
export declare class UpdateEventDto {
    title?: string;
    description?: string;
    dateTime?: string;
    location?: string;
    language?: string;
    organizerId?: number;
    type?: EventType;
    state?: string;
    staffIds?: number[];
    expectedGuests?: number;
    status?: string;
}
