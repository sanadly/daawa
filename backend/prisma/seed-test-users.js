const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed test users with different roles...');

  // Create test users with different roles if they don't exist
  const users = [
    {
      email: 'user@example.com',
      name: 'Regular User',
      password: await bcrypt.hash('password', 10),
      role: 'USER',
      isEmailVerified: true,
    },
    {
      email: 'staff@example.com',
      name: 'Staff Member',
      password: await bcrypt.hash('password', 10),
      role: 'STAFF',
      isEmailVerified: true,
    },
    {
      email: 'organizer@example.com',
      name: 'Event Organizer',
      password: await bcrypt.hash('password', 10),
      role: 'ORGANIZER',
      isEmailVerified: true,
    },
    {
      email: 'admin@example.com',
      name: 'Administrator',
      password: await bcrypt.hash('password', 10),
      role: 'ADMIN',
      isEmailVerified: true,
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: userData,
      });
      console.log(`Created user: ${user.email} with role: ${user.role}`);
    } else {
      // Update existing user to ensure they have the correct role and verified status
      const user = await prisma.user.update({
        where: { email: userData.email },
        data: {
          role: userData.role,
          isEmailVerified: true,
        },
      });
      console.log(`Updated user: ${user.email} with role: ${user.role}`);
    }
  }

  console.log('Test users seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 