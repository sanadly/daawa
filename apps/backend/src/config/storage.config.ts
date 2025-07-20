import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  provider: process.env.STORAGE_PROVIDER || 'local', // 'local' or 's3'
  local: {
    path: process.env.LOCAL_STORAGE_PATH || 'uploads',
  },
  maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: process.env.STORAGE_ALLOWED_MIME_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ],
})); 