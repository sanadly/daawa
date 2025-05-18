import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly configService;
    private brevoApi;
    private readonly senderEmail;
    private readonly appName;
    constructor(configService: ConfigService);
    sendVerificationEmail(to: string, recipientNameOrEmail: string, token: string): Promise<void>;
    sendPasswordResetEmail(to: string, recipientNameOrEmail: string, token: string): Promise<void>;
}
