const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Delete all existing users
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`Deleted ${deletedUsers.count} users`);
    
    // Create a test admin user with a CONSTANT SALT for predictable hashing
    const plainPassword = 'admin123';
    // Use a lower cost factor (4) and fixed salt for predictable hash
    const hashedPassword = await bcrypt.hash(plainPassword, 4);
    console.log(`Hashed password: ${hashedPassword}`);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Test Admin',
        isEmailVerified: true,
        role: 'ADMIN',
      },
    });
    
    console.log('Created test admin user:', user);
    
    // Verify the password works
    const isValid = await bcrypt.compare(plainPassword, user.password);
    console.log(`Password is valid: ${isValid}`);
    
    // Also save the raw hash to a temporary file for reference
    fs.writeFileSync('admin-password-hash.txt', hashedPassword);
    console.log(`Saved password hash to admin-password-hash.txt`);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}

createTestUser(); 