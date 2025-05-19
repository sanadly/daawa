const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function testPassword() {
  try {
    // Find the test user
    const user = await prisma.user.findFirst({ 
      where: { email: 'user@example.com' } 
    });
    
    if (!user) {
      console.log('Test user not found!');
      return;
    }
    
    console.log('Found user:', { id: user.id, email: user.email, name: user.name });
    
    // Get the stored password hash
    const storedHash = user.password;
    console.log('Stored password hash:', storedHash);
    
    // Test known password
    const testPassword = 'password123';
    const isCorrectPassword = await bcrypt.compare(testPassword, storedHash);
    console.log(`Password "password123" is correct: ${isCorrectPassword ? 'YES' : 'NO'}`);
    
    // Test wrong password
    const wrongPassword = 'wrongPassword';
    const isWrongPassword = await bcrypt.compare(wrongPassword, storedHash);
    console.log(`Password "wrongPassword" is correct: ${isWrongPassword ? 'YES' : 'NO'}`);
    
    // Generate hash for the expected test password
    const generatedHash = await bcrypt.hash('password123', 10);
    console.log(`Generated hash for "password123": ${generatedHash}`);
    console.log(`Generated hash matches stored?: ${generatedHash === storedHash ? 'YES' : 'NO (expected, salts differ)'}`);
    
    // Check if "password123" hashed for admin
    const admin = await prisma.user.findFirst({ 
      where: { email: 'admin@example.com' } 
    });
    
    if (admin) {
      const adminPasswordIsCorrect = await bcrypt.compare('admin123', admin.password);
      console.log(`Admin password "admin123" is correct: ${adminPasswordIsCorrect ? 'YES' : 'NO'}`);
    }
  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword(); 