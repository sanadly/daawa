const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    // Find the test user
    const user = await prisma.user.findFirst({ 
      where: { email: 'user@example.com' } 
    });
    
    if (!user) {
      console.error('Test user not found!');
      return;
    }
    
    console.log('Found user:', { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    });
    
    // Create a new password and hash it
    const newPassword = 'testpassword123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: passwordHash,
        // Ensure these fields are set for login
        isEmailVerified: true,
        emailVerificationToken: null,
      }
    });
    
    console.log(`Password for ${updatedUser.email} has been reset to: "${newPassword}"`);
    console.log('Password hash:', passwordHash);
    
    // Test the hash immediately to verify
    const verifyPassword = await bcrypt.compare(newPassword, passwordHash);
    console.log(`Password verification test: ${verifyPassword ? 'PASSED' : 'FAILED'}`);
    
    console.log('\nPassword reset completed successfully!');
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword(); 