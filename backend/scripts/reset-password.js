const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Configuration
const EMAIL = 'user@example.com';
const NEW_PASSWORD = 'testpassword123';
const JWT_SECRET = process.env.JWT_SECRET || 'Aachen##2024-DefaultSecret';
const JWT_EXPIRES_IN = '1d';

async function resetPassword() {
  console.log('Starting password reset and token generation...');
  const prisma = new PrismaClient();

  try {
    // Find the user
    console.log(`Looking for user with email: ${EMAIL}`);
    const user = await prisma.user.findUnique({
      where: { email: EMAIL }
    });

    if (!user) {
      console.error('User not found!');
      return;
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Hash the new password
    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Update the user with the new password
    console.log('Updating user password...');
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        isEmailVerified: true // Ensure email is verified
      }
    });

    console.log('Password updated successfully!');

    // Create JWT tokens
    console.log('Generating JWT tokens...');
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    console.log('Tokens generated:', {
      accessTokenPreview: accessToken.substring(0, 20) + '...',
      refreshTokenPreview: refreshToken.substring(0, 20) + '...'
    });

    // Verify the tokens
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET);
      console.log('Access token verified, payload:', decoded);
    } catch (error) {
      console.error('Access token verification failed:', error.message);
    }

    // Create a test login payload for frontend testing
    const testLoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    };

    // Save to a file for easier testing
    const outputFile = path.join(__dirname, 'test-auth-tokens.json');
    fs.writeFileSync(outputFile, JSON.stringify(testLoginResponse, null, 2));
    console.log(`Test login response saved to ${outputFile}`);

    console.log('\nTest Login Instructions:');
    console.log('------------------------');
    console.log(`Email: ${EMAIL}`);
    console.log(`Password: ${NEW_PASSWORD}`);
    console.log('\nYou can also use the pre-generated tokens from test-auth-tokens.json');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

resetPassword(); 