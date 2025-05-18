"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("tsconfig-paths/register");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookieParser = require("cookie-parser");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: 'http://localhost:3000',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.use(cookieParser());
    if (process.env.NODE_ENV !== 'production') {
        await createTestUsers();
    }
    const port = process.env.PORT || 3002;
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
async function createTestUsers() {
    try {
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const prisma = new client_1.PrismaClient();
        const testUsers = [
            { email: 'user@example.com', name: 'Regular User', role: client_1.Role.USER },
            { email: 'admin@example.com', name: 'Admin User', role: client_1.Role.ADMIN },
            { email: 'staff@example.com', name: 'Staff Member', role: client_1.Role.STAFF },
            { email: 'organizer@example.com', name: 'Event Organizer', role: client_1.Role.ORGANIZER }
        ];
        console.log('Creating test users with password: "password123"');
        for (const user of testUsers) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: {
                    role: user.role,
                    password: hashedPassword,
                    isEmailVerified: true,
                },
                create: {
                    email: user.email,
                    password: hashedPassword,
                    name: user.name,
                    role: user.role,
                    isEmailVerified: true,
                    language: 'en',
                },
            });
            console.log(`Test user: ${user.email} (${user.role}) created or updated`);
        }
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('Error creating test users:', error);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map