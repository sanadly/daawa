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
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('BREVO_API_KEY');
        if (!apiKey) {
            throw new Error('BREVO_API_KEY is not configured in .env file');
        }
        const transactionalEmailsApiInstance = new Brevo.TransactionalEmailsApi();
        if (typeof transactionalEmailsApiInstance.getApiClient !== 'function') {
            console.error("TransactionalEmailsApi instance does not have getApiClient(). Available keys on instance:", Object.keys(transactionalEmailsApiInstance));
            const GlobalBrevoAny = Brevo;
            if (!GlobalBrevoAny.ApiClient || typeof GlobalBrevoAny.ApiClient.instance === 'undefined') {
                console.error("Global Brevo.ApiClient.instance also not found. Module keys:", Object.keys(GlobalBrevoAny));
                throw new Error('Cannot obtain Brevo ApiClient instance. Check SDK documentation for client configuration.');
            }
            const defaultClient = GlobalBrevoAny.ApiClient.instance;
            const apiKeyAuth = defaultClient.authentications['api-key'];
            apiKeyAuth.apiKey = apiKey;
            console.warn('Used speculative global Brevo.ApiClient.instance for authentication.');
        }
        else {
            const apiClient = transactionalEmailsApiInstance.getApiClient();
            const apiKeyAuth = apiClient.authentications['api-key'];
            apiKeyAuth.apiKey = apiKey;
        }
        this.brevoApi = transactionalEmailsApiInstance;
        this.senderEmail =
            this.configService.get('BREVO_SENDER_EMAIL') || 'noreply@example.com';
    }
    async sendVerificationEmail(to, username, token) {
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
        }
        catch (error) {
            console.error('Error sending verification email via Brevo:', error);
            throw new Error('Failed to send verification email.');
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map