'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { checkinApi, CheckinStatisticsResponse } from '@/app/lib/checkin/checkin-api';

interface StatisticsViewProps {
  eventId: string;
  onClose: () => void;
}

export default function StatisticsView({ eventId, onClose }: StatisticsViewProps) {
  const t = useTranslations('Checkin');
  const [stats, setStats] = useState<CheckinStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await checkinApi.getStatistics(eventId);
        setStats(data);
      } catch (err) {
        setError(t('error_loading_stats'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [eventId, t]);

  const renderStatCard = (title: string, value: string | number) => (
    <div className="bg-gray-700 p-4 rounded-lg text-center">
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('statistics_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        {loading && <p>{t('loading_stats')}</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {stats && (
          <div className="flex-grow overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {renderStatCard(t('total_guests'), stats.total_guests)}
              {renderStatCard(t('checked_in'), stats.checked_in_count)}
              {renderStatCard(t('checkin_rate'), `${stats.checkin_percentage.toFixed(1)}%`)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-120px)]">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">{t('checkins_by_tier')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.by_tier} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="tier_name" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} />
                    <Legend />
                    <Bar dataKey="checked_in_count" fill="#4299e1" name={t('checked_in')} />
                    <Bar dataKey="total_guests" fill="#2c5282" name={t('total_guests')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">{t('checkins_over_time')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.timeline} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="hour" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#48bb78" name={t('checked_in')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 