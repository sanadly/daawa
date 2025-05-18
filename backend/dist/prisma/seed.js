"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seeding process...');
    const testUsers = [
        { email: 'user@example.com', name: 'Regular User', role: client_1.Role.USER },
        { email: 'admin@example.com', name: 'Admin User', role: client_1.Role.ADMIN },
        { email: 'staff@example.com', name: 'Staff Member', role: client_1.Role.STAFF },
        { email: 'organizer@example.com', name: 'Event Organizer', role: client_1.Role.ORGANIZER }
    ];
    const hashedPassword = '$2b$10$d0K5pwWWGTvnF4QZnxqIguSOPA0xK5F1A/UsSVC3NP5R8w.bYHcOO';
    for (const user of testUsers) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                role: user.role,
                isEmailVerified: true,
                password: hashedPassword,
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
        console.log(`User ${user.email} with role ${user.role} created or updated successfully.`);
    }
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map