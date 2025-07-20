const sharp = require('sharp');

async function testSharp() {
  try {
    console.log('Testing Sharp...');
    
    // Create a simple 400x600 white image
    const image = sharp({
      create: {
        width: 400,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });
    
    const buffer = await image.png().toBuffer();
    console.log('✅ Sharp test successful! Generated buffer size:', buffer.length);
    
    return buffer;
  } catch (error) {
    console.error('❌ Sharp test failed:', error);
    throw error;
  }
}

testSharp().catch(console.error); 