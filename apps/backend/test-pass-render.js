const fetch = require('node-fetch');
const fs = require('fs');

const testPassRender = async () => {
  try {
    const designConfig = {
      canvas: { width: 400, height: 600 },
      background: '#ffffff',
      elements: [
        {
          id: 'simple-text',
          type: 'text',
          text: 'Hello World',
          x: 200,
          y: 100,
          fontSize: 32,
          fontFamily: 'Arial',
          fill: '#000000',
          align: 'center',
        },
      ],
    };

    console.log('Testing pass render API with simple design...');
    
    const response = await fetch('http://localhost:3001/api/v1/passes/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: 'test-event',
        format: 'png',
        designConfig,
      }),
    });

    if (response.ok) {
      const buffer = await response.buffer();
      fs.writeFileSync('./test-pass.png', buffer);
      console.log('✅ Pass rendered successfully! Saved as test-pass.png');
    } else {
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      const error = await response.text();
      console.error('❌ Failed to render pass:', error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testPassRender(); 