import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';

// Interface for expected Brevo error structure for better type safety in logging
interface BrevoError {
  response?: {
    body?: unknown; // Brevo might have a more specific type
  };
  message?: string;
  // Add other common error properties if known
}

@Injectable()
export class EmailService {
  private brevoApi: Brevo.TransactionalEmailsApi;
  private readonly senderEmail: string;
  private readonly appName: string = 'Daawa App'; // Or your actual app name

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    // ---- START DIAGNOSTIC LOGS ----
    console.log(
      '[DEBUG EmailService Constructor] BREVO_API_KEY from ConfigService:',
      apiKey,
    );
    const senderEmailFromConfig = this.configService.get<string>(
      'BREVO_SENDER_EMAIL',
    );
    console.log(
      '[DEBUG EmailService Constructor] BREVO_SENDER_EMAIL from ConfigService:',
      senderEmailFromConfig,
    );
    const frontendUrlFromConfig =
      this.configService.get<string>('FRONTEND_URL');
    console.log(
      '[DEBUG EmailService Constructor] FRONTEND_URL from ConfigService:',
      frontendUrlFromConfig,
    );
    // ---- END DIAGNOSTIC LOGS ----

    if (!apiKey) {
      console.error('BREVO_API_KEY is not configured in .env file');
      throw new Error('BREVO_API_KEY is not configured in .env file');
    }

    try {
      const transactionalEmailsApiInstance = new Brevo.TransactionalEmailsApi();

      if (
        typeof transactionalEmailsApiInstance.setApiKey === 'function' &&
        Brevo.TransactionalEmailsApiApiKeys &&
        typeof Brevo.TransactionalEmailsApiApiKeys.apiKey !== 'undefined'
      ) {
        transactionalEmailsApiInstance.setApiKey(
          Brevo.TransactionalEmailsApiApiKeys.apiKey,
          apiKey,
        );
        this.brevoApi = transactionalEmailsApiInstance;
        console.log('Brevo TransactionalEmailsApi initialized successfully.');
      } else {
        let sdkErrorReason = 'Unknown SDK structure issue.';
        if (typeof transactionalEmailsApiInstance.setApiKey !== 'function') {
          sdkErrorReason =
            'transactionalEmailsApiInstance.setApiKey is not a function.';
        } else if (
          !Brevo.TransactionalEmailsApiApiKeys ||
          typeof Brevo.TransactionalEmailsApiApiKeys.apiKey === 'undefined'
        ) {
          sdkErrorReason =
            'Brevo.TransactionalEmailsApiApiKeys.apiKey is not available.';
        }
        console.error('Brevo SDK Initialization Error:', sdkErrorReason);
        throw new Error(
          `Failed to initialize Brevo API client: ${sdkErrorReason}. Please check Brevo SDK version and documentation.`,
        );
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        'Error during Brevo EmailService initialization:',
        errorMessage,
      );
      throw new Error(
        `Failed to initialize Brevo EmailService: ${errorMessage}`,
      );
    }

    this.senderEmail =
      senderEmailFromConfig || // Use the value read from .env first
      `noreply@${this.appName.toLowerCase().replace(/\s+/g, '')}.com`;

    if (!senderEmailFromConfig) {
      // Check if it was actually loaded
      console.warn(
        `BREVO_SENDER_EMAIL was not found by ConfigService. Using default: ${this.senderEmail}`,
      );
    }
    console.log(
      `[DEBUG EmailService Constructor] Final senderEmail being used: ${this.senderEmail}`,
    ); // Log final sender
  }

  async sendVerificationEmail(
    to: string,
    recipientNameOrEmail: string, // Renamed from 'username'
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000', // Default if not found
    );
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = {
      email: this.senderEmail, // This now uses the senderEmail set in constructor
      name: this.appName,
    };
    sendSmtpEmail.subject = `Verify Your Email Address for ${this.appName}`;
    sendSmtpEmail.htmlContent = `
      <p>Hi ${recipientNameOrEmail},</p>
      <p>Thanks for registering with ${this.appName}. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      <p>If you did not create an account, no further action is required.</p>
    `;

    try {
      await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      console.log(`Verification email sent to ${to} via Brevo`);
    } catch (error) {
      const brevoError = error as BrevoError; // Type assertion
      console.error(
        'Error sending verification email via Brevo:',
        brevoError.message || 'Unknown error',
      );
      if (brevoError.response && brevoError.response.body) {
        console.error(
          'Brevo API Error Body:',
          JSON.stringify(brevoError.response.body, null, 2),
        );
      } else if (typeof error === 'object' && error !== null) {
        // Fallback for other error structures, stringify the whole error
        console.error(
          'Full Brevo Error Object:',
          JSON.stringify(error, null, 2),
        );
      }
      throw new Error('Failed to send verification email.');
    }
  }

  async sendPasswordResetEmail(
    to: string,
    recipientNameOrEmail: string,
    token: string,
  ): Promise<void> {
    console.log(`VERY DISTINCT LOG: sendPasswordResetEmail CALLED for ${to} with token ${token}`);
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = {
      email: this.senderEmail,
      name: this.appName,
    };
    sendSmtpEmail.subject = `Password Reset Request for ${this.appName}`;
    sendSmtpEmail.htmlContent = `
      <p>Hi ${recipientNameOrEmail},</p>
      <p>You requested a password reset for your account with ${this.appName}.</p>
      <p>Please click the link below to set a new password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 1 hour (or your configured time).</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;

    try {
      await this.brevoApi.sendTransacEmail(sendSmtpEmail);
      console.log(`Password reset email sent to ${to} via Brevo`);
    } catch (error) {
      const brevoError = error as BrevoError;
      console.error(
        'Error sending password reset email via Brevo:',
        brevoError.message || 'Unknown error',
      );
      if (brevoError.response && brevoError.response.body) {
        console.error(
          'Brevo API Error Body:',
          JSON.stringify(brevoError.response.body, null, 2),
        );
      } else if (typeof error === 'object' && error !== null) {
        console.error(
          'Full Brevo Error Object:',
          JSON.stringify(error, null, 2),
        );
      }
      throw new Error('Failed to send password reset email.');
    }
  }
}