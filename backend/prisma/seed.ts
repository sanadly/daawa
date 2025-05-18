import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding process...');

  // Create test users for each role
  const testUsers = [
    { email: 'user@example.com', name: 'Regular User', role: Role.USER },
    { email: 'admin@example.com', name: 'Admin User', role: Role.ADMIN },
    { email: 'staff@example.com', name: 'Staff Member', role: Role.STAFF },
    { email: 'organizer@example.com', name: 'Event Organizer', role: Role.ORGANIZER }
  ];

  // Use a directly hashed password that equals 'password123'
  // This is the hash of 'password123' with 10 salt rounds
  const hashedPassword = '$2b$10$d0K5pwWWGTvnF4QZnxqIguSOPA0xK5F1A/UsSVC3NP5R8w.bYHcOO';

  // Upsert each test user (create if doesn't exist, update if it does)
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