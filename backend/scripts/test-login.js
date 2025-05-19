const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Default JWT Secret (matching what we set in our auth module)
const JWT_SECRET = process.env.JWT_SECRET || 'Aachen##2024-DefaultSecret';

async function testDirectLogin() {
  try {
    console.log('Starting direct login test...');
    
    // 1. Find the user
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
    
    // 2. Validate password
    const password = 'password123';
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log(`Password validation result: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    
    if (!isPasswordValid) {
      console.error('Password validation failed!');
      return;
    }
    
    // 3. Create JWT token (similar to what AuthService.login does)
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    console.log('Creating JWT with payload:', payload);
    console.log('Using JWT_SECRET with length:', JWT_SECRET.length);
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Successfully generated token:', token.substring(0, 20) + '...');
    
    // 4. Verify the token can be decoded
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Successfully verified token, decoded payload:', decoded);
    } catch (error) {
      console.error('Token verification failed:', error.message);
    }
    
    console.log('\nDirect login test completed successfully!');
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectLogin(); 