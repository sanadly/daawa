import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLanguage } from '../hooks/useLanguage';
import api from '../lib/api';
import toast from 'react-hot-toast';

const QRTestPage: React.FC = () => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const isRTL = language === 'ar';
  const [eventId, setEventId] = useState('');
  const [guestId, setGuestId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    if (!eventId || !guestId) {
      toast.error('Please enter both Event ID and Guest ID');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<{ qrCodeData: string }>(`/checkin/event/${eventId}/guest/${guestId}/qr-code`);
      setQrCode(response.data.qrCodeData);
      toast.success('QR Code generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateAndCheckin = async () => {
    if (!qrCode) {
      toast.error('Please generate a QR code first');
      return;
    }

    setLoading(true);
    try {
      // First validate the QR code
      const validateResponse = await api.post('/checkin/validate-qr', {
        qr_code_data: qrCode,
        event_id: eventId,
      });

      if (validateResponse.data.is_valid) {
        // Then perform the check-in
        const checkinResponse = await api.post('/checkin/record', {
          guest_id: guestId,
          event_id: eventId,
          checkin_method: 'qr_code',
          qr_code_data: qrCode
        });

        setCheckinResult(checkinResponse.data);
        toast.success('Check-in successful!');
      } else {
        toast.error('Invalid QR code');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code Test & Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventId">Event ID</Label>
              <Input
                id="eventId"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Enter event ID"
              />
            </div>
            <div>
              <Label htmlFor="guestId">Guest ID</Label>
              <Input
                id="guestId"
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                placeholder="Enter guest ID"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateQR} disabled={loading}>
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Button>
            <Button onClick={validateAndCheckin} disabled={loading || !qrCode} variant="outline">
              {loading ? 'Processing...' : 'Validate & Check-in'}
            </Button>
          </div>

          {qrCode && (
            <Card>
              <CardHeader>
                <CardTitle>Generated QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <QRCodeCanvas value={qrCode} size={200} />
                <p className="text-sm text-gray-600 break-all">{qrCode}</p>
              </CardContent>
            </Card>
          )}

          {checkinResult && (
            <Card>
              <CardHeader>
                <CardTitle>Check-in Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(checkinResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1.</strong> {t('qrTest.step1')}</p>
          <p><strong>2.</strong> {t('qrTest.step2')}</p>
          <p><strong>3.</strong> {t('qrTest.step3')}</p>
          <p><strong>4.</strong> {t('qrTest.step4')}</p>
          <p><strong>5.</strong> {t('qrTest.step5')}</p>
          <p><strong>6.</strong> {t('qrTest.step6')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRTestPage; 