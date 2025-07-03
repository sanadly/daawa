"use client";

import { useState } from 'react';
import { useAuth } from '../../../../lib/auth/auth-context';
import { QRScanner } from './QRScanner';
import { ManualLookup } from './ManualLookup';
import { OfflineIndicator } from './OfflineIndicator';
import { GuestCheckinDetails } from './GuestCheckinDetails';
import { checkinApi, QRValidationResponse, CheckinResponse } from '../../../../lib/checkin/checkin-api';
import { offlineManager } from '../../../../lib/checkin/offline-manager';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import StatisticsView from './StatisticsView';
import { EventSelector } from './EventSelector';

type ScanMode = 'qr' | 'manual';

export const CheckinInterface = () => {
  const t = useTranslations('CheckinPage');
  const { user, logout } = useAuth();
  const [scanMode, setScanMode] = useState<ScanMode>('qr');
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<QRValidationResponse | null>(null);
  const [checkinResult, setCheckinResult] = useState<CheckinResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    setIsProcessing(true);
    try {
      // Check if online for QR validation
      if (typeof window !== 'undefined' && !navigator.onLine) {
        toast.error(t('qrError'));
        setIsProcessing(false);
        return;
      }

      const result = await checkinApi.validateQR(qrCode);
      setValidationResult(result);
      
      if (result.valid) {
        toast.success(t('qrValidated'));
        // Don't auto-checkin anymore, show details view
      } else {
        toast.error(result.message || t('invalidQR'));
      }
    } catch (error: any) {
      console.error('QR validation error:', error);
      toast.error(error.message || 'Failed to validate QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRError = (error: string) => {
    console.error('QR scanner error:', error);
    toast.error(error);
  };

  const handleCheckin = async (guestId: string, additionalGuestIds: string[], guestData?: any) => {
    setIsProcessing(true);
    try {
      const checkinData = {
        guest_id: guestId,
        additional_guest_ids: additionalGuestIds,
        checkin_method: (scanMode === 'qr' ? 'qr_code' : 'manual') as 'qr_code' | 'manual',
        device_info: navigator.userAgent,
        location: 'Check-in Portal',
      };

      // Check if online - if not, queue for offline sync
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const offlineCheckin = await offlineManager.queueCheckin({
          ...checkinData,
          guest_data: guestData ? {
            first_name: guestData.first_name || '',
            last_name: guestData.last_name || '',
            email: guestData.email || '',
            tier_name: guestData.tier_name || '',
          } : undefined,
          additional_guests: additionalGuestIds.map(id => {
            const guest = (validationResult?.guest as any)?.additional_guests?.find((g: any) => g.id === id);
            return { id, name: guest?.name || 'Guest' };
          })
        });

        // Create a mock result for UI consistency
        const mockResult: CheckinResponse = {
          success: true,
          checkin_id: offlineCheckin.id,
          guest: {
            id: guestId,
            name: guestData ? `${guestData.first_name} ${guestData.last_name}` : 'Guest',
            email: guestData?.email || '',
            tier_name: guestData?.tier_name || '',
          },
          additional_guests: offlineCheckin.additional_guests || [],
          guest_count: 1 + (offlineCheckin.additional_guests?.length || 0),
          checkin_timestamp: offlineCheckin.offline_timestamp,
          message: 'Offline check-in queued for sync',
        };

        setCheckinResult(mockResult);
        toast.success(t('checkinOfflineQueued'));
        
        // Reset after successful offline check-in
        setTimeout(() => {
          setValidationResult(null);
          setCheckinResult(null);
        }, 4000);
        return;
      }

      // Online check-in
      const result = await checkinApi.recordCheckin(checkinData);
      setCheckinResult(result);
      
      if (result.success) {
        toast.success(`Successfully checked in ${result.guest.name}`);
        // Reset after successful check-in
        setTimeout(() => {
          setValidationResult(null);
          setCheckinResult(null);
        }, 3000);
      } else {
        toast.error(t('checkinFailed'));
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      
      // Fallback to offline mode is complex with additional guests,
      // the primary offline check at the start of the function is safer.
      
      toast.error(error.message || 'Failed to process check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCheckin = (primaryGuestId: string, additionalGuestIds: string[]) => {
    handleCheckin(primaryGuestId, additionalGuestIds, validationResult?.guest);
  };

  const handleCancelCheckin = () => {
    setValidationResult(null);
  };

  const startNewScan = () => {
    setValidationResult(null);
    setCheckinResult(null);
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {t('title')}
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setShowStats(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium p-1 sm:p-0 rounded-md hover:bg-gray-100"
              >
                {t('view_statistics')}
              </button>
              <OfflineIndicator />
              <div className="hidden sm:flex items-center space-x-1">
                <span className="text-sm text-gray-600">
                  {t('welcome')},
                </span>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium p-1 sm:p-0 rounded-md hover:bg-gray-100"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Modal */}
      {showStats && user?.currentEventId && (
        <StatisticsView
          eventId={user.currentEventId}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-4 sm:py-6 px-2 sm:px-4 lg:px-8">
        {!user?.currentEventId ? (
          <EventSelector />
        ) : (
          <>
            {/* Mode Selector */}
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-center">
                <div className="bg-white rounded-lg p-1 shadow-sm border">
                  <button
                    onClick={() => setScanMode('qr')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      scanMode === 'qr'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('scanModeQR')}
                  </button>
                  <button
                    onClick={() => setScanMode('manual')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      scanMode === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t('scanModeManual')}
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Content: Show scanner/lookup OR success message */}
            {!checkinResult ? (
              <>
                {/* Show Guest Details for confirmation if a valid QR has been scanned */}
                {validationResult && validationResult.valid ? (
                  <GuestCheckinDetails
                    validationResult={validationResult}
                    onConfirmCheckin={handleConfirmCheckin}
                    onCancel={handleCancelCheckin}
                    isProcessing={isProcessing}
                  />
                ) : (
                  <>
                    {/* QR Scanner Mode */}
                    {scanMode === 'qr' && (
                      <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                          <div className="text-center mb-4">
                            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                              Scan Guest QR Code
                            </h2>
                            <p className="text-gray-600">
                              Position the QR code within the camera frame
                            </p>
                          </div>
                          
                          <QRScanner
                            onScan={handleQRScan}
                            onError={handleQRError}
                            isActive={!isProcessing && !validationResult}
                            className="h-64 sm:h-96 w-full max-w-sm sm:max-w-md mx-auto"
                          />
                          
                          {isProcessing && (
                            <div className="mt-4 text-center">
                              <div className="inline-flex items-center text-blue-600">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Manual Lookup Mode */}
                    {scanMode === 'manual' && (
                      <ManualLookup onCheckin={(guestId, guestData) => handleCheckin(guestId, [], guestData)} isProcessing={isProcessing} />
                    )}
                  </>
                )}
              </>
            ) : (
              // Check-in Success View
              <div className="text-center bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  {checkinResult.message || t('checkinSuccessful')}
                </h2>
                <p className="text-gray-700">
                  {t('checkedInGuest', { guestName: checkinResult.guest.name })}
                </p>
                {checkinResult.additional_guests.length > 0 && (
                  <p className="text-gray-600 mt-1">
                    (+{checkinResult.additional_guests.length} additional guests)
                  </p>
                )}
                <button
                  onClick={startNewScan}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {t('newScan')}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}; 