// Simple test script to debug the generate endpoint
// Run with: node test-generate.js

const testData = {
  "version": 1,
  "createdAt": new Date().toISOString(),
  "app": { "name": "reelMakerAI" },
  "canvases": [
    {
      "id": "test-canvas",
      "width": 450,
      "height": 800,
      "elements": [
        {
          "id": "test-text-1",
          "type": "text",
          "properties": {
            "text": "Hello World",
            "subtype": "question",
            "x": 100,
            "y": 100
          }
        },
        {
          "id": "test-rect-1", 
          "type": "rectangle",
          "properties": {
            "text": "Click me",
            "subtype": "option",
            "x": 50,
            "y": 200
          }
        }
      ]
    }
  ]
};

async function testGenerate() {
  try {
    console.log('Testing generate endpoint...');
    console.log('Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const result = await response.text();
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Success!');
    } else {
      console.log('❌ Failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGenerate();