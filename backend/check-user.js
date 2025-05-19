const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('Checking test user in database...');
    
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'user@example.com' }
    });
    
    if (!user) {
      console.error('Test user not found in database!');
      return;
    }
    
    // Print user details
    console.log('User found:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
    
    // Test password verification
    const testPassword = 'password123';
    const passwordMatches = await bcrypt.compare(testPassword, user.password);
    
    console.log(`\nPassword verification test:`);
    console.log(`Test password: ${testPassword}`);
    console.log(`Password hash: ${user.password.substring(0, 10)}...`);
    console.log(`Password matches: ${passwordMatches}`);
    
    // If not verified, update to verified
    if (!user.isEmailVerified) {
      console.log('\nUpdating user to set email as verified...');
      await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true }
      });
      console.log('User updated successfully. Email is now verified.');
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 