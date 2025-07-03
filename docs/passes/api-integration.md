# Pass Generation API Integration

## Overview

The Pass Generation API provides secure, scalable endpoints for generating digital passes in multiple formats including PDF, Apple Wallet, and Google Wallet. The API is designed with modern REST principles, comprehensive error handling, and enterprise-grade security.

## Base URL

```
https://api.daawa.app/passes
```

## Authentication

All endpoints (except health check and QR validation) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Authentication Flow

1. **Login**: `POST /auth/login` with credentials
2. **Get Token**: Receive JWT access token in response
3. **Use Token**: Include in `Authorization` header for API calls
4. **Refresh**: Use refresh token when access token expires

## API Endpoints

### 1. Health Check

Check the status of all pass generation services.

```http
GET /passes/health
```

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "service": "pdf",
      "status": "healthy",
      "details": {
        "browser": true,
        "pagePool": 5,
        "queueSize": 0,
        "templateCached": true,
        "maxConcurrentPages": 5
      }
    },
    {
      "service": "apple-wallet",
      "status": "not_implemented",
      "details": { "available": false }
    },
    {
      "service": "google-wallet", 
      "status": "not_implemented",
      "details": { "available": false }
    }
  ]
}
```

### 2. Generation Statistics

Get performance statistics for pass generation (Admin/Organizer only).

```http
GET /passes/stats
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalGenerated": 1523,
    "averageGenerationTime": 387,
    "successRate": 99.67,
    "lastGenerated": "2024-01-15T14:30:22.000Z"
  }
}
```

### 3. Generate PDF Pass

Generate a PDF pass with QR code and localization support.

```http
GET /passes/pdf/{eventId}/{guestId}
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `eventId` (UUID): Event identifier
- `guestId` (UUID): Guest identifier
- `download` (boolean, optional): Force download vs inline display
- `language` (string, optional): Language preference (`en`, `ar`)

**Headers:**
- `User-Agent` (optional): Client identification for logging

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
     -H "User-Agent: EventApp/1.0" \
     "https://api.daawa.app/passes/pdf/550e8400-e29b-41d4-a716-446655440000/6ba7b810-9dad-11d1-80b4-00c04fd430c8?download=true&language=ar"
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="pass-{guestId}-{eventId}.pdf"
Content-Length: 245760
Cache-Control: private, max-age=3600
X-Generation-Time: 342ms
```

**Success Response:** PDF binary data

**Error Responses:**
- `401`: Unauthorized - Invalid or missing authentication
- `404`: Guest or event not found
- `400`: Guest not registered for event
- `500`: PDF generation failed

### 4. Generate Apple Wallet Pass

Generate an Apple Wallet (.pkpass) pass file.

```http
POST /passes/apple-wallet/{eventId}/{guestId}
Authorization: Bearer <jwt_token>
```

**Response Headers:**
```
Content-Type: application/vnd.apple.pkpass
Content-Disposition: attachment; filename="pass-{guestId}-{eventId}.pkpass"
```

**Success Response:** Apple Wallet pass binary data

**Error Responses:**
- `401`: Unauthorized
- `404`: Guest or event not found
- `501`: Service not implemented

### 5. Generate Google Wallet Pass

Generate a Google Wallet save URL.

```http
POST /passes/google-wallet/{eventId}/{guestId}
Authorization: Bearer <jwt_token>
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "saveUrl": "https://pay.google.com/gp/v/save/...",
    "passId": "unique-pass-identifier"
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `404`: Guest or event not found
- `501`: Service not implemented

### 6. Validate QR Code Token

Validate a QR code token from a generated pass (public endpoint).

```http
GET /passes/validate/{token}
```

**Parameters:**
- `token` (string): JWT token from QR code

**Success Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "guestId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "passId": "pass-unique-identifier",
    "issuedAt": "2024-01-15T14:30:22.000Z",
    "expiresAt": "2024-01-16T14:30:22.000Z"
  }
}
```

**Invalid Token Response:**
```json
{
  "success": false,
  "data": {
    "valid": false,
    "error": "Invalid or expired token"
  }
}
```

## PDF Pass Features

### Localization Support

The PDF generation service supports English and Arabic with Libyan dialect:

**English Labels:**
- Event Name, Event Date, Event Location
- Guest Name, Ticket Type
- Instructions: "Please present this pass at the event entrance"
- Welcome: "Welcome"

**Arabic Labels (Libyan Dialect):**
- اسم الفعالية، تاريخ الفعالية، مكان الفعالية
- اسم الضيف، نوع البطاقة
- Instructions: "يرجى إظهار هذه البطاقة عند الوصول للفعالية"
- Welcome: "أهلاً وسهلاً بكم"

### RTL Support

Arabic passes automatically apply:
- Right-to-left text direction
- Arabic-compatible fonts (Amiri, Noto Sans Arabic)
- Proper text alignment and layout mirroring
- Libyan locale date formatting

### QR Code Security

QR codes contain signed JWT tokens with:
- Event ID, Guest ID, Pass ID
- Cryptographic signature for verification
- Configurable expiration time
- Tamper-resistant encoding

## Error Handling

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Guest is not registered for this event",
  "error": "Bad Request",
  "timestamp": "2024-01-15T14:30:22.000Z",
  "path": "/passes/pdf/event-id/guest-id"
}
```

### Common Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 | Bad Request | Invalid UUIDs, guest not registered |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Event or guest doesn't exist |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Service failure, PDF generation error |
| 501 | Not Implemented | Apple/Google Wallet services |

### Error Recovery

**PDF Generation Failures:**
1. Check service health: `GET /passes/health`
2. Verify guest and event exist
3. Retry with exponential backoff
4. Fall back to alternative pass format

**Authentication Failures:**
1. Refresh JWT token
2. Re-authenticate if refresh fails
3. Check token expiration and scopes

## Rate Limiting

### Current Limits
- **PDF Generation**: 60 requests per minute per user
- **Health Check**: 100 requests per minute per IP
- **QR Validation**: 200 requests per minute per IP

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1610724000
```

## Performance Optimization

### Caching Strategy

**PDF Passes:**
- Browser instances: Persistent connection
- Page pool: Pre-warmed pages for fast generation
- Template cache: 5-minute TTL for HTML templates
- Response cache: 1-hour cache control headers

**Performance Metrics:**
- Average generation time: 200-400ms
- Concurrent requests: 5+ simultaneous
- Memory usage: 50-100MB baseline
- Success rate: >99.5%

### Best Practices

**Client-Side:**
1. **Cache PDF responses** using ETags and cache headers
2. **Implement retry logic** with exponential backoff
3. **Show loading indicators** for PDF generation
4. **Preload passes** for events starting soon

**Server-Side:**
1. **Monitor health endpoints** for service status
2. **Track generation statistics** for performance insights
3. **Implement circuit breakers** for external dependencies
4. **Use CDN** for serving static pass assets

## Integration Examples

### JavaScript/TypeScript

```typescript
class PassService {
  private baseUrl = 'https://api.daawa.app/passes';
  private authToken: string;

  async generatePdfPass(eventId: string, guestId: string, options: {
    download?: boolean;
    language?: 'en' | 'ar';
  } = {}): Promise<Blob> {
    const params = new URLSearchParams();
    if (options.download) params.set('download', 'true');
    if (options.language) params.set('language', options.language);
    
    const response = await fetch(
      `${this.baseUrl}/pdf/${eventId}/${guestId}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'User-Agent': 'EventApp/1.0.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }
    
    return response.blob();
  }

  async validateQrToken(token: string): Promise<{
    valid: boolean;
    eventId?: string;
    guestId?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/validate/${token}`);
    const result = await response.json();
    return result.data;
  }
}
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class PassService:
    def __init__(self, base_url: str = "https://api.daawa.app/passes", auth_token: str = None):
        self.base_url = base_url
        self.auth_token = auth_token
    
    def generate_pdf_pass(self, event_id: str, guest_id: str, 
                         download: bool = False, language: str = "en") -> bytes:
        params = {
            "download": str(download).lower(),
            "language": language
        }
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "User-Agent": "EventApp/1.0.0"
        }
        
        response = requests.get(
            f"{self.base_url}/pdf/{event_id}/{guest_id}",
            params=params,
            headers=headers
        )
        
        response.raise_for_status()
        return response.content
    
    def validate_qr_token(self, token: str) -> Dict[str, Any]:
        response = requests.get(f"{self.base_url}/validate/{token}")
        response.raise_for_status()
        return response.json()["data"]
```

### React Hook

```typescript
import { useState, useCallback } from 'react';

interface PassGenerationState {
  loading: boolean;
  error: string | null;
  pdfUrl: string | null;
}

export const usePassGeneration = (authToken: string) => {
  const [state, setState] = useState<PassGenerationState>({
    loading: false,
    error: null,
    pdfUrl: null
  });

  const generatePass = useCallback(async (
    eventId: string, 
    guestId: string, 
    language: 'en' | 'ar' = 'en'
  ) => {
    setState({ loading: true, error: null, pdfUrl: null });
    
    try {
      const response = await fetch(
        `/api/passes/pdf/${eventId}/${guestId}?language=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate pass');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setState({ loading: false, error: null, pdfUrl: url });
      return url;
    } catch (error) {
      setState({ 
        loading: false, 
        error: error.message, 
        pdfUrl: null 
      });
      throw error;
    }
  }, [authToken]);

  return { ...state, generatePass };
};
```

## Security Considerations

### Authentication & Authorization
- JWT tokens with proper expiration
- Role-based access control (RBAC)
- Secure token storage and transmission

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection in PDF templates

### QR Code Security
- Cryptographically signed tokens
- Time-based expiration
- Tamper detection

### Privacy Compliance
- GDPR/CCPA compliant data handling
- Guest data minimization in passes
- Secure deletion of temporary files

## Monitoring & Logging

### Key Metrics
- Request volume and response times
- Error rates by endpoint and error type
- PDF generation success rate
- Resource utilization (CPU, memory, disk)

### Logging Standards
- Structured JSON logging
- Request tracing with correlation IDs
- Security event logging
- Performance metrics collection

### Alerting
- Service health degradation
- High error rates (>5%)
- Performance degradation (>2s response times)
- Resource exhaustion warnings

This API provides a robust, secure, and performant foundation for digital pass generation with comprehensive documentation for easy integration and maintenance. 