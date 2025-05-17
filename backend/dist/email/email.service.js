"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Brevo = require("@getbrevo/brevo");
let EmailService = class EmailService {
    configService;
    brevoApi;
    senderEmail;
    appName = 'Daawa App';
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('BREVO_API_KEY');
        console.log('[DEBUG EmailService Constructor] BREVO_API_KEY from ConfigService:', apiKey);
        const senderEmailFromConfig = this.configService.get('BREVO_SENDER_EMAIL');
        console.log('[DEBUG EmailService Constructor] BREVO_SENDER_EMAIL from ConfigService:', senderEmailFromConfig);
        const frontendUrlFromConfig = this.configService.get('FRONTEND_URL');
        console.log('[DEBUG EmailService Constructor] FRONTEND_URL from ConfigService:', frontendUrlFromConfig);
        if (!apiKey) {
            console.error('BREVO_API_KEY is not configured in .env file');
            throw new Error('BREVO_API_KEY is not configured in .env file');
        }
        try {
            const transactionalEmailsApiInstance = new Brevo.TransactionalEmailsApi();
            if (typeof transactionalEmailsApiInstance.setApiKey === 'function' &&
                Brevo.TransactionalEmailsApiApiKeys &&
                typeof Brevo.TransactionalEmailsApiApiKeys.apiKey !== 'undefined') {
                transactionalEmailsApiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
                this.brevoApi = transactionalEmailsApiInstance;
                console.log('Brevo TransactionalEmailsApi initialized successfully.');
            }
            else {
                let sdkErrorReason = 'Unknown SDK structure issue.';
                if (typeof transactionalEmailsApiInstance.setApiKey !== 'function') {
                    sdkErrorReason =
                        'transactionalEmailsApiInstance.setApiKey is not a function.';
                }
                else if (!Brevo.TransactionalEmailsApiApiKeys ||
                    typeof Brevo.TransactionalEmailsApiApiKeys.apiKey === 'undefined') {
                    sdkErrorReason =
                        'Brevo.TransactionalEmailsApiApiKeys.apiKey is not available.';
                }
                console.error('Brevo SDK Initialization Error:', sdkErrorReason);
                throw new Error(`Failed to initialize Brevo API client: ${sdkErrorReason}. Please check Brevo SDK version and documentation.`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error during Brevo EmailService initialization:', errorMessage);
            throw new Error(`Failed to initialize Brevo EmailService: ${errorMessage}`);
        }
        this.senderEmail =
            senderEmailFromConfig ||
                `noreply@${this.appName.toLowerCase().replace(/\s+/g, '')}.com`;
        if (!senderEmailFromConfig) {
            console.warn(`BREVO_SENDER_EMAIL was not found by ConfigService. Using default: ${this.senderEmail}`);
        }
        console.log(`[DEBUG EmailService Constructor] Final senderEmail being used: ${this.senderEmail}`);
    }
    async sendVerificationEmail(to, recipientNameOrEmail, token) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.sender = {
            email: this.senderEmail,
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
        }
        catch (error) {
            const brevoError = error;
            console.error('Error sending verification email via Brevo:', brevoError.message || 'Unknown error');
            if (brevoError.response && brevoError.response.body) {
                console.error('Brevo API Error Body:', JSON.stringify(brevoError.response.body, null, 2));
            }
            else if (typeof error === 'object' && error !== null) {
                console.error('Full Brevo Error Object:', JSON.stringify(error, null, 2));
            }
            throw new Error('Failed to send verification email.');
        }
    }
    async sendPasswordResetEmail(to, recipientNameOrEmail, token) {
        console.log(`VERY DISTINCT LOG: sendPasswordResetEmail CALLED for ${to} with token ${token}`);
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
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
        }
        catch (error) {
            const brevoError = error;
            console.error('Error sending password reset email via Brevo:', brevoError.message || 'Unknown error');
            if (brevoError.response && brevoError.response.body) {
                console.error('Brevo API Error Body:', JSON.stringify(brevoError.response.body, null, 2));
            }
            else if (typeof error === 'object' && error !== null) {
                console.error('Full Brevo Error Object:', JSON.stringify(error, null, 2));
            }
            throw new Error('Failed to send password reset email.');
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map