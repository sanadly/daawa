'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../../lib/auth/auth-context';
import { checkinApi, EventResponse } from '../../../../lib/checkin/checkin-api';
import { useTranslations } from 'next-intl';

export const EventSelector = () => {
  const t = useTranslations('CheckinPage');
  const { setCurrentEvent } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const activeEvents = await checkinApi.getEvents();
        setEvents(activeEvents);
      } catch (err) {
        setError(t('error_loading_events'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [t]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">{t('select_event')}</h2>
      {loading && <p>{t('loading_events')}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-4">
        {events.map((event) => (
          <li key={event.id}>
            <button
              onClick={() => setCurrentEvent(event.id)}
              className="w-full text-left p-4 bg-gray-100 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <p className="font-semibold text-lg">{event.name}</p>
              <span className={`text-sm px-2 py-1 rounded-full ${
                event.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
              }`}>
                {event.status}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}; 