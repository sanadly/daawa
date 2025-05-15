import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    findOneByUsername(username: string): Promise<User | null>;
    findOneByEmail(email: string): Promise<User | null>;
    create(user: Partial<User>): Promise<User>;
    setCurrentRefreshToken(refreshToken: string | null, userId: number): Promise<void>;
    getUserIfRefreshTokenMatches(refreshToken: string, userId: number): Promise<User | null>;
    findOneByEmailVerificationToken(token: string): Promise<User | null>;
    setEmailVerified(userId: number): Promise<void>;
    updateEmailVerificationToken(userId: number, newToken: string): Promise<void>;
}
