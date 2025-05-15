import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly configService;
    private brevoApi;
    private readonly senderEmail;
    constructor(configService: ConfigService);
    sendVerificationEmail(to: string, username: string, token: string): Promise<void>;
}
