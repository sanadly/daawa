import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private brevoApi: Brevo.TransactionalEmailsApi;
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured in .env file');
    }

    // Instantiate TransactionalEmailsApi first
    const transactionalEmailsApiInstance = new Brevo.TransactionalEmailsApi();

    // Try to get the ApiClient via getApiClient() method from the instance
    if (typeof (transactionalEmailsApiInstance as any).getApiClient !== 'function') {
        console.error(
            "TransactionalEmailsApi instance does not have getApiClient(). Available keys on instance:", 
            Object.keys(transactionalEmailsApiInstance)
        );
        // Fallback or further investigation needed if this path is taken.
        // For now, let's see if we can access a global default apiClient if previous attempts failed.
        // This is highly speculative as Brevo.ApiClient was undefined.
        const GlobalBrevoAny = Brevo as any;
        if (!GlobalBrevoAny.ApiClient || typeof GlobalBrevoAny.ApiClient.instance === 'undefined') {
            console.error("Global Brevo.ApiClient.instance also not found. Module keys:", Object.keys(GlobalBrevoAny));
            throw new Error('Cannot obtain Brevo ApiClient instance. Check SDK documentation for client configuration.');
        }
        // If we reach here, it means global was found, which contradicts earlier findings but trying for robustness.
        const defaultClient = GlobalBrevoAny.ApiClient.instance;
        const apiKeyAuth = defaultClient.authentications['api-key'];
        apiKeyAuth.apiKey = apiKey;
        console.warn('Used speculative global Brevo.ApiClient.instance for authentication.')
    } else {
        // Preferred path: get client from the API service instance
        const apiClient = (transactionalEmailsApiInstance as any).getApiClient();
        const apiKeyAuth = apiClient.authentications['api-key'];
        apiKeyAuth.apiKey = apiKey;
    }

    this.brevoApi = transactionalEmailsApiInstance; 

    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@example.com';
  }

  async sendVerificationEmail(
    to: string,
    username: string,
    token: string,
  ): Promise<void> {
    const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: this.senderEmail, name: 'Your App Name' };
    sendSmtpEmail.subject = 'Verify Your Email Address';
    sendSmtpEmail.htmlContent = `
      <p>Hi ${username},</p>
      <p>Thanks for registering. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>If you did not create an account, no further action is required.</p>
    `;

    try {
      await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      console.log(`Verification email sent to ${to} (Brevo)`);
    } catch (error) {
      console.error('Error sending verification email via Brevo:', error);
      throw new Error('Failed to send verification email.');
    }
  }
} 