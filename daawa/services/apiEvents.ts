const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
import { fetchApi } from './apiAuth'; // Reuse the generic fetchApi

export interface CreateEventData {
  title: string;
  description?: string;
  dateTime: string;
  location?: string;
  type: string;
  language?: string;
  state?: string;
  expectedGuests?: number;
  
  // Add other fields as needed
}

export interface EventData extends CreateEventData {
  id: number;
  organizerId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const createEvent = async (eventData: CreateEventData) => {
  return fetchApi('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

export const getEvents = async (): Promise<EventData[]> => {
  return fetchApi('/events', {
    method: 'GET',
  });
};

export const getEventById = async (id: number): Promise<EventData> => {
  return fetchApi(`/events/${id}`, {
    method: 'GET',
  });
};
