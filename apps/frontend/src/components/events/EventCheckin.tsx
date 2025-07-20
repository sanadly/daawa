import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Event, CheckinStatistics, CheckinRecord, QrValidationResponse, CheckinMethod } from '../../types';
import { useTranslation } from 'react-i18next';
import { QrCode, UserCheck, Users, BarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Html5QrcodeScanner, Html5QrcodeResult } from 'html5-qrcode';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const QrScanner: React.FC<{
  onScanSuccess: (decodedText: string, result: Html5QrcodeResult) => void;
  onScanFailure: (error: string) => void;
}> = ({ onScanSuccess, onScanFailure }) => {
  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    qrScanner.render(onScanSuccess, onScanFailure);

    return () => {
      qrScanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode-scanner.", error);
      });
    };
  }, [onScanSuccess, onScanFailure]);

  return <div id="qr-reader" className="w-full"></div>;
};

const EventCheckin: React.FC<{ event: Event }> = ({ event }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<CheckinStatistics | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<QrValidationResponse | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchCheckinData = async () => {
    try {
      setLoadingStats(true);
      const [statsRes, recentRes] = await Promise.all([
        api.get(`/checkin/statistics/${event.id}`),
        api.get(`/checkin/history/${event.id}?limit=5`),
      ]);
      setStats(statsRes.data);
      setRecentCheckins(recentRes.data.checkins || []);
    } catch (error) {
      toast.error(t('checkin.fetchFailed'));
      console.error("Failed to fetch checkin data", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchCheckinData();
    const interval = setInterval(fetchCheckinData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [event.id]);

  const onScanSuccess = async (decodedText: string) => {
    try {
      const response = await api.post('/checkin/validate-qr', {
        qr_code_data: decodedText,
        event_id: event.id,
      });
      setValidationResult(response.data);
    } catch (error) {
      toast.error('Invalid QR Code');
      setValidationResult({
        is_valid: false,
        error_message: 'Invalid QR Code format or network error.',
        already_checked_in: false
      });
    }
  };

  const handleConfirmCheckin = async () => {
    if (!validationResult?.guest) return;

    setIsCheckingIn(true);
    try {
      await api.post('/checkin/record', {
        guest_id: validationResult.guest.id,
        event_id: event.id,
        checkin_method: CheckinMethod.QR_CODE,
      });
      toast.success(`${validationResult.guest.name} checked in successfully!`);
      setValidationResult(null);
      setIsScannerOpen(false);
      fetchCheckinData(); // Refresh data immediately
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in guest.');
    } finally {
      setIsCheckingIn(false);
    }
  };
  
  const resetScanner = () => {
    setValidationResult(null);
  }

  if (loadingStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('checkin.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return <p>{t('checkin.noData')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('checkin.totalGuests')} value={stats.total_guests} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title={t('checkin.checkedIn')} value={stats.checked_in_count} icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title={t('checkin.checkinRate')} value={`${stats.checkin_percentage.toFixed(1)}%`} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full lg:col-span-1">
              <QrCode className="mr-2 h-5 w-5" />
              {t('checkin.scanQr')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('checkin.scanQr')}</DialogTitle>
            </DialogHeader>
            {!validationResult ? (
              <QrScanner
                onScanSuccess={onScanSuccess}
                onScanFailure={(error) => console.log(error)}
              />
            ) : (
              <div className="mt-4 text-center">
                {validationResult.is_valid && validationResult.guest ? (
                  <div>
                    <h3 className="text-lg font-semibold">{validationResult.guest.name}</h3>
                    <p className="text-sm text-muted-foreground">{validationResult.guest.tier_name}</p>
                    {validationResult.already_checked_in && <p className="text-yellow-500 mt-2">{t('checkin.alreadyCheckedIn')}</p>}
                    <div className="mt-4 flex justify-center gap-4">
                      <Button variant="outline" onClick={resetScanner}>{t('checkin.scanAgain')}</Button>
                      {!validationResult.already_checked_in && (
                        <Button onClick={handleConfirmCheckin} disabled={isCheckingIn}>
                          {isCheckingIn ? t('checkin.checkingIn') : t('checkin.confirmCheckin')}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-red-500">{validationResult.error_message || t('checkin.invalidQr')}</p>
                    <Button className="mt-4" onClick={resetScanner}>{t('checkin.scanAgain')}</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('checkin.timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_slot" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name={t('checkin.checkins')} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('checkin.recentCheckins')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('guests.name')}</TableHead>
                  <TableHead>{t('checkin.time')}</TableHead>
                  <TableHead>{t('checkin.method')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCheckins.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.guest_name}</TableCell>
                    <TableCell>{new Date(record.checkin_timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>{record.checkin_method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventCheckin; 