"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("tsconfig-paths/register");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const auth_service_1 = require("./auth/auth.service");
const PORT_DEFAULT = 3006;
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    logger.log('Starting application bootstrap process');
    try {
        logger.log('Creating NestJS application...');
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        logger.log('NestJS application created successfully');
        logger.log('Debugging registered routes...');
        const server = app.getHttpServer();
        const router = server._events?.request?._router;
        if (router && router.stack) {
            const availableRoutes = router.stack
                .filter((layer) => layer && layer.route)
                .map((layer) => {
                const route = layer.route;
                const pathValue = route.path;
                const methods = route.methods ? Object.keys(route.methods).map((m) => m.toUpperCase()).join(',') : 'N/A';
                return { path: pathValue, methods };
            });
            logger.log(`Available routes: ${JSON.stringify(availableRoutes, null, 2)}`);
        }
        else {
            logger.warn('Could not retrieve router stack to list routes. Router or stack is undefined.');
        }
        logger.log('Configuring CORS...');
        app.enableCors({
            origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
            allowedHeaders: 'Content-Type, Accept, Authorization',
        });
        logger.log('CORS configured successfully');
        logger.log('Setting up global validation pipe...');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }));
        logger.log('Global validation pipe configured successfully');
        logger.log('Setting up cookie parser middleware...');
        app.use(cookieParser());
        logger.log('Cookie parser middleware configured successfully');
        app.use('/health', (req, res) => {
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        logger.log('Health check endpoint configured successfully');
        if (process.env.NODE_ENV !== 'production') {
            try {
                logger.log('Creating test users for development environment...');
                const authService = app.get(auth_service_1.AuthService);
                await authService.createTestUsers();
                logger.log('Test users created successfully');
            }
            catch (error) {
                logger.error('Failed to create test users', error instanceof Error ? error.stack : String(error));
            }
        }
        let port;
        if (process.env.PORT) {
            port = parseInt(process.env.PORT, 10);
            logger.log(`Using PORT from environment: ${port}`);
        }
        else {
            try {
                logger.log('Finding available port using port-finder script...');
                const { execSync } = await Promise.resolve().then(() => require('child_process'));
                const result = execSync('node scripts/port-finder.js check', {
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                const match = result.match(/Available port: (\d+)/);
                if (match && match[1]) {
                    port = parseInt(match[1], 10);
                    logger.log(`Found available port using port-finder: ${port}`);
                }
                else {
                    port = PORT_DEFAULT;
                    logger.log(`Using default port: ${port}`);
                }
            }
            catch (err) {
                logger.error('Error running port-finder script:', err instanceof Error ? err.message : String(err));
                port = PORT_DEFAULT;
                logger.log(`Using default port due to error: ${port}`);
            }
        }
        try {
            logger.log(`Attempting to start server on port ${port}...`);
            await app.listen(port);
            logger.log(`Application is running on: http://localhost:${port}`);
            const portFilePath = path.join(process.cwd(), 'current-port.json');
            fs.writeFileSync(portFilePath, JSON.stringify({ port }));
            logger.log(`Port information saved to ${portFilePath}`);
        }
        catch (initialError) {
            logger.error(`Failed to start server on initial port ${port}:`, initialError instanceof Error ? initialError.message : String(initialError));
            if (initialError instanceof Error && initialError.message.includes('EADDRINUSE')) {
                logger.warn('Initial port in use. Attempting to find an available port in range 3000-3010...');
                let foundPort = false;
                for (let p = 3000; p <= 3010; p++) {
                    if (p === port)
                        continue;
                    try {
                        logger.log(`Attempting to listen on port ${p}...`);
                        await app.listen(p);
                        port = p;
                        logger.log(`Application is running on alternate port: http://localhost:${port}`);
                        const portFilePath = path.join(process.cwd(), 'current-port.json');
                        fs.writeFileSync(portFilePath, JSON.stringify({ port }));
                        logger.log(`Port information saved to ${portFilePath}`);
                        foundPort = true;
                        break;
                    }
                    catch (tryError) {
                        logger.warn(`Port ${p} is also in use or encountered an error: ${tryError instanceof Error ? tryError.message : String(tryError)}`);
                    }
                }
                if (!foundPort) {
                    logger.error('Failed to find an available port in the specified range. Exiting.');
                    process.exit(1);
                }
            }
            else {
                logger.error('An unexpected error occurred while starting the server. Exiting.');
                process.exit(1);
            }
        }
    }
    catch (bootstrapError) {
        logger.error('Fatal error during bootstrap:', bootstrapError instanceof Error ? bootstrapError.stack : String(bootstrapError));
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map