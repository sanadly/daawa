"use client";

import { useState, useEffect } from 'react';
import { offlineManager } from '../../../../lib/checkin/offline-manager';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface OfflineStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  queueCount: number;
}

export const OfflineIndicator = () => {
  const t = useTranslations('OfflineIndicator');
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    syncInProgress: false,
    queueCount: 0,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleStatusChange = (newStatus: OfflineStatus) => {
      setStatus(newStatus);
    };

    offlineManager.addListener(handleStatusChange);

    return () => {
      offlineManager.removeListener(handleStatusChange);
    };
  }, []);

  const handleSync = async () => {
    try {
      const result = await offlineManager.syncCheckins();
      if (result) {
        if (result.success_count > 0) {
          toast.success(`Successfully synced ${result.success_count} check-ins`);
        }
        if (result.error_count > 0) {
          toast.error(`Failed to sync ${result.error_count} check-ins`);
        }
      }
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const getStatusIndicator = () => {
    if (status.syncInProgress) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">{t('syncing')}</span>
        </div>
      );
    }

    if (!status.isOnline) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
          </svg>
          <span className="text-sm">{t('offline')}</span>
          {status.queueCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {status.queueCount} {t('queued')}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-green-600">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm">{t('online')}</span>
        {status.queueCount > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            {status.queueCount} {t('pending')}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Main Status Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm hover:bg-gray-50 transition-colors"
      >
        {getStatusIndicator()}
        
        {status.queueCount > 0 && (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 sm:p-4">
            <h3 className="font-medium text-gray-900 mb-3">{t('connectionStatus')}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('connection')}:</span>
                <span className={`text-sm font-medium ${status.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {status.isOnline ? t('online') : t('offline')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('queuedCheckins')}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {status.queueCount}
                </span>
              </div>
              
              {status.syncInProgress && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('syncStatus')}:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {t('inProgress')}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {status.queueCount > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                {status.isOnline && !status.syncInProgress && (
                  <button
                    onClick={handleSync}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    {t('syncNow')}
                  </button>
                )}
                
                {!status.isOnline && (
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Check-ins will sync automatically when connection is restored.
                    </p>
                    <button
                      onClick={() => offlineManager.clearQueue()}
                      className="text-xs sm:text-sm text-red-600 hover:text-red-700"
                    >
                      {t('clearQueue')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Info Message */}
            {!status.isOnline && (
              <div className="mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <strong>{t('offline')}:</strong> {t('offlineMessage')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 