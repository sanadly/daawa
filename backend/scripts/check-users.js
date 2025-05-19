const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst({ 
      where: { email: 'user@example.com' } 
    });
    console.log('Test user:', user ? 'EXISTS' : 'NOT FOUND');
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        emailVerificationToken: user.emailVerificationToken,
        hasRefreshToken: !!user.hashedRefreshToken
      });
    }

    // Check admin user
    const admin = await prisma.user.findFirst({ 
      where: { email: 'admin@example.com' } 
    });
    console.log('Admin user:', admin ? 'EXISTS' : 'NOT FOUND');
    if (admin) {
      console.log('Admin details:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isEmailVerified: admin.isEmailVerified
      });
    }

    // List all users
    const allUsers = await prisma.user.findMany();
    console.log(`Total users in database: ${allUsers.length}`);
    console.log('All users:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run(); 