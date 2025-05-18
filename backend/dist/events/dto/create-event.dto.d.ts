export declare enum EventType {
    WEDDING = "WEDDING",
    CONFERENCE = "CONFERENCE",
    PARTY = "PARTY",
    OTHER = "OTHER"
}
export declare class CreateEventDto {
    title: string;
    description?: string;
    dateTime: string;
    location?: string;
    language?: string;
    type: EventType;
    state?: string;
    staffIds?: number[];
    expectedGuests?: number;
}
