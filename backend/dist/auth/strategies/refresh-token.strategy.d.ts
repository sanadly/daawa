import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
interface RefreshTokenPayload {
    username: string;
    sub: number;
}
declare const RefreshTokenStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(payload: RefreshTokenPayload): any;
}
export {};
