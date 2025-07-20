import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

import api from '../lib/api';
import { Progress } from './ui/progress';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  initialUrl?: string | null;
  uploadPath?: string; // e.g., 'event-banners'
  endpoint?: string;
  requestBody?: Record<string, any>;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  initialUrl,
  uploadPath = 'general',
  endpoint = '/storage/upload/image',
  requestBody = {},
}) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setError(null);
      setProgress(0);

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add default and custom body parameters
        const body: Record<string, any> = { folder: uploadPath, bucket: 'event-assets', ...requestBody };
        for (const key in body) {
          formData.append(key, body[key]);
        }

        const response = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
            }
          },
        });

        if (response.data.success) {
          const uploadedUrl = response.data.data.original.url;
          onUploadSuccess(uploadedUrl);
          toast.success(t('designer.uploadSuccess'));
        } else {
          throw new Error('Upload failed');
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        setError(err.response?.data?.message || t('designer.uploadFailed'));
        toast.error(t('designer.uploadFailed'));
        setPreview(initialUrl || null);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onUploadSuccess, uploadPath, t, initialUrl, endpoint, requestBody]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-48 mx-auto rounded-lg"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">{t('designer.uploading')}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader className="w-12 h-12 animate-spin text-primary-500 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {t('designer.uploading')}
                </p>
                <div className="w-64 mb-2">
                  <Progress value={progress} className="h-2" />
                </div>
                <p className="text-sm text-gray-500">{progress}%</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {t('designer.dragAndDrop')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('designer.clickToUpload')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;