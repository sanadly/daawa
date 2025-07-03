"use client";

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useTranslations } from 'next-intl';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError: (error: string) => void;
  isActive: boolean;
  className?: string;
}

export const QRScanner = ({ onScan, onError, isActive, className = '' }: QRScannerProps) => {
  const t = useTranslations('QRScanner');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Initialize scanner and get camera permissions
  useEffect(() => {
    const initScanner = async () => {
      try {
        // Request camera permission
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);

        // Initialize reader
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Get available devices
        const videoDevices = await reader.listVideoInputDevices();
        setDevices(videoDevices);
        
        // Select back camera if available (for mobile)
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        setSelectedDeviceId(backCamera?.deviceId || videoDevices[0]?.deviceId || '');

      } catch (error) {
        console.error('Failed to initialize QR scanner:', error);
        setHasPermission(false);
        onError(t('noCameraPermission'));
      }
    };

    initScanner();

    // Cleanup
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [onError, t]);

  // Start/stop scanning based on isActive prop
  useEffect(() => {
    if (isActive && hasPermission && selectedDeviceId && videoRef.current) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isActive, hasPermission, selectedDeviceId]);

  const startScanning = async () => {
    if (!readerRef.current || !videoRef.current || isScanning) return;

    try {
      setIsScanning(true);
      
      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            onScan(result.getText());
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('QR scan error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start scanning:', error);
      setIsScanning(false);
      onError(t('cameraError'));
    }
  };

  const stopScanning = () => {
    if (readerRef.current && isScanning) {
      readerRef.current.reset();
      setIsScanning(false);
    }
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDeviceId(devices[nextIndex].deviceId);
    }
  };

  if (hasPermission === null) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('scanning')}</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-center p-4 sm:p-8">
          <svg className="h-10 w-10 sm:h-12 sm:w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base sm:text-lg font-medium text-red-900 mb-2">{t('noCameraPermission')}</h3>
          <p className="text-red-700 mb-4 text-sm sm:text-base">
            Please allow camera access to scan QR codes. You may need to refresh the page and grant permission.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            {t('requestPermission')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Scanning Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Scanning Frame */}
          <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white opacity-70 relative">
            {/* Corner Indicators */}
            <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-blue-400"></div>
            <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-blue-400"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-blue-400"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-blue-400"></div>
            
            {/* Scanning Line Animation */}
            {isScanning && (
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 animate-pulse"></div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 transform -translate-x-1/2 text-center w-full">
            <p className="text-white text-xs sm:text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {isScanning ? t('scanning') : 'Position QR code within frame'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 space-y-2">
        {/* Camera Switch Button */}
        {devices.length > 1 && (
          <button
            onClick={switchCamera}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
            title={t('selectCamera')}
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4">
        <div className={`flex items-center space-x-2 text-white text-xs sm:text-sm bg-black bg-opacity-50 px-2 py-1 sm:px-3 rounded ${isScanning ? 'text-green-400' : 'text-yellow-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
          <span>{isScanning ? 'Active' : 'Standby'}</span>
        </div>
      </div>
    </div>
  );
}; 