"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("./auth/auth.service");
const users_service_1 = require("./users/users.service");
const prisma_service_1 = require("./prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
(async () => {
    console.log('Setting up test environment...');
    const prisma = new prisma_service_1.PrismaService();
    const usersService = new users_service_1.UsersService(prisma);
    const jwtService = new jwt_1.JwtService({});
    const configService = new config_1.ConfigService();
    const emailService = {};
    const authService = new auth_service_1.AuthService(usersService, jwtService, configService, emailService, prisma);
    try {
        console.log('Testing validateUser with test credentials...');
        const validatedUser = await authService.validateUser('user@example.com', 'password123');
        console.log('Validation result:', validatedUser);
        if (validatedUser) {
            console.log('User validation successful!');
            try {
                console.log('Attempting login...');
                const loginResult = await authService.login(validatedUser);
                console.log('Login successful!', loginResult);
            }
            catch (loginError) {
                console.error('Login error:', loginError);
            }
        }
        else {
            console.log('User validation failed!');
        }
    }
    catch (error) {
        console.error('Error during validateUser test:', error);
    }
    await prisma.$disconnect();
})();
//# sourceMappingURL=test-auth.js.map