import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body preview:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
  }
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ReelMaker AI Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes will be added here
app.use('/api/projects', (req, res) => {
  res.json({ message: 'Projects API endpoint' });
});

// Generate content with OpenAI - Generate complete question set based on AI topic with repeat support
app.post('/api/generate', async (req, res) => {
  try {
    console.log('\n=== GENERATE ENDPOINT HIT ===');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not found');
      return res.status(400).json({ 
        error: 'OpenAI API key not configured'
      });
    }
    
    if (!req.body || !req.body.canvases) {
      console.log('❌ No project data received');
      return res.status(400).json({
        error: 'No project data received'
      });
    }

    // Clone the project data to modify it
    const updatedProject = JSON.parse(JSON.stringify(req.body));
    
    console.log('Processing canvases with repeat support...');
    
    // Store background images to reuse when backgroundRepeat is enabled
    const reusableBackgrounds = new Map();
    
    // Process each canvas and generate repeats
    const processedCanvases = [];
    
    for (const canvas of updatedProject.canvases) {
      const repeatCount = canvas.repeat || 0;
      const totalCanvases = 1 + repeatCount; // Original + repeats
      
      console.log(`Processing canvas ${canvas.id}: creating ${totalCanvases} canvas${totalCanvases > 1 ? 'es' : ''} (original + ${repeatCount} repeat${repeatCount !== 1 ? 's' : ''})`);
      
      let sharedBackgroundImage = null;
      
      // Generate background image once if backgroundRepeat is enabled and AI background is specified
      if (canvas.canvasMeta && canvas.canvasMeta.trim() && canvas.backgroundRepeat) {
        const backgroundKey = `${canvas.canvasMeta.trim()}_${canvas.width}x${canvas.height}`;
        
        if (reusableBackgrounds.has(backgroundKey)) {
          sharedBackgroundImage = reusableBackgrounds.get(backgroundKey);
          console.log(`♻️ Reusing cached background for: "${canvas.canvasMeta}"`);
        } else {
          console.log(`🎨 Generating shared background for ${totalCanvases} canvases: "${canvas.canvasMeta}"`);
          
          try {
            // Determine image size based on canvas dimensions
            const canvasWidth = canvas.width || 450;
            const canvasHeight = canvas.height || 800;
            
            // DALL-E 3 supports: 1024x1024, 1792x1024, or 1024x1792
            let imageSize = '1024x1024'; // default square
            const aspectRatio = canvasWidth / canvasHeight;
            
            if (aspectRatio > 1.5) {
              imageSize = '1792x1024'; // landscape
            } else if (aspectRatio < 0.7) {
              imageSize = '1024x1792'; // portrait
            }
            
            const backgroundPrompt = `Create a background image: ${canvas.canvasMeta}. Make it suitable as a background with good contrast for text overlays.`;
            
            const imageResponse = await openai.images.generate({
              model: 'dall-e-3',
              prompt: backgroundPrompt,
              size: imageSize,
              quality: 'standard',
              n: 1
            });
            
            if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url) {
              // Download and convert to data URL
              const imageDownloadResponse = await fetch(imageResponse.data[0].url);
              if (imageDownloadResponse.ok) {
                const imageBuffer = await imageDownloadResponse.arrayBuffer();
                const imageBase64 = Buffer.from(imageBuffer).toString('base64');
                const mimeType = imageDownloadResponse.headers.get('content-type') || 'image/png';
                const dataUrl = `data:${mimeType};base64,${imageBase64}`;
                
                sharedBackgroundImage = dataUrl;
                reusableBackgrounds.set(backgroundKey, dataUrl);
                console.log(`✅ Shared background generated and cached (${Math.round(imageBuffer.byteLength / 1024)}KB)`);
              }
            }
          } catch (err) {
            console.error(`❌ Error generating shared background:`, err.message);
          }
        }
      }
      
      // Create multiple canvases (original + repeats)
      for (let i = 0; i < totalCanvases; i++) {
        const isOriginal = i === 0;
        const canvasCopy = JSON.parse(JSON.stringify(canvas));
        
        // Update canvas ID for copies
        if (!isOriginal) {
          canvasCopy.id = canvas.id + `_repeat_${i}`;
        }
        
        // Apply shared background if available
        if (sharedBackgroundImage) {
          canvasCopy.backgroundSrc = sharedBackgroundImage;
          canvasCopy.background = sharedBackgroundImage;
        } else if (canvasCopy.canvasMeta && canvasCopy.canvasMeta.trim() && !canvasCopy.backgroundRepeat) {
          // Generate individual background for this canvas
          console.log(`🎨 Generating individual background for canvas ${canvasCopy.id}: "${canvasCopy.canvasMeta}"`);
          
          try {
            const canvasWidth = canvasCopy.width || 450;
            const canvasHeight = canvasCopy.height || 800;
            const aspectRatio = canvasWidth / canvasHeight;
            let imageSize = '1024x1024';
            
            if (aspectRatio > 1.5) {
              imageSize = '1792x1024';
            } else if (aspectRatio < 0.7) {
              imageSize = '1024x1792';
            }
            
            const backgroundPrompt = `Create a background image: ${canvasCopy.canvasMeta}. Make it suitable as a background with good contrast for text overlays.`;
            
            const imageResponse = await openai.images.generate({
              model: 'dall-e-3',
              prompt: backgroundPrompt,
              size: imageSize,
              quality: 'standard',
              n: 1
            });
            
            if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url) {
              const imageDownloadResponse = await fetch(imageResponse.data[0].url);
              if (imageDownloadResponse.ok) {
                const imageBuffer = await imageDownloadResponse.arrayBuffer();
                const imageBase64 = Buffer.from(imageBuffer).toString('base64');
                const mimeType = imageDownloadResponse.headers.get('content-type') || 'image/png';
                const dataUrl = `data:${mimeType};base64,${imageBase64}`;
                
                canvasCopy.backgroundSrc = dataUrl;
                canvasCopy.background = dataUrl;
                console.log(`✅ Individual background generated for ${canvasCopy.id} (${Math.round(imageBuffer.byteLength / 1024)}KB)`);
              }
            }
          } catch (err) {
            console.error(`❌ Error generating individual background for ${canvasCopy.id}:`, err.message);
          }
        }
        
        // Process Multiple Option groups for content generation
        if (canvasCopy.elements) {
          for (const element of canvasCopy.elements) {
            if (element.type === 'group' && 
                element.properties && 
                element.properties.name === 'Multiple Option' &&
                element.elements) {
              
              const aiTopic = element.properties.aiTopic || 'general knowledge';
              console.log(`📝 Generating question content for canvas ${canvasCopy.id}, group: ${element.id}, topic: "${aiTopic}"`);
              
              try {
                const prompt = `Generate a multiple choice question about "${aiTopic}". Return only valid JSON in this exact format:
{
  "question": "Your question here (maximum 10 words)",
  "options": [
    "Option 1 (maximum 8 words)",
    "Option 2 (maximum 8 words)", 
    "Option 3 (maximum 8 words)",
    "Option 4 (maximum 8 words)"
  ],
  "correctAnswer": 1
}

The correctAnswer should be the index (0-3) of the correct option. Make sure the question is clear and has only one correct answer.`;

                const completion = await openai.chat.completions.create({
                  model: 'gpt-3.5-turbo',
                  messages: [{ 
                    role: 'user', 
                    content: prompt 
                  }],
                  max_tokens: 300,
                  temperature: 0.7
                });

                const responseText = completion.choices[0]?.message?.content?.trim();
                
                if (responseText) {
                  let questionData;
                  try {
                    questionData = JSON.parse(responseText);
                  } catch (parseError) {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      questionData = JSON.parse(jsonMatch[0]);
                    } else {
                      throw new Error('Could not parse JSON response');
                    }
                  }

                  if (questionData.question && questionData.options && Array.isArray(questionData.options) && 
                      questionData.options.length === 4 && typeof questionData.correctAnswer === 'number') {
                    
                    // Update the elements with the generated content
                    let questionUpdated = false;
                    let optionIndex = 0;
                    
                    for (const groupElement of element.elements) {
                      if (groupElement.type === 'rectangle' && groupElement.properties) {
                        if (groupElement.properties.subtype === 'question' && !questionUpdated) {
                          groupElement.properties.text = questionData.question;
                          questionUpdated = true;
                        } else if (groupElement.properties.subtype === 'option' && optionIndex < 4) {
                          groupElement.properties.text = questionData.options[optionIndex];
                          groupElement.properties.isCorrect = (optionIndex === questionData.correctAnswer);
                          optionIndex++;
                        }
                      }
                    }

                    element.properties.correctAnswerIndex = questionData.correctAnswer;
                    element.properties.correctAnswerText = questionData.options[questionData.correctAnswer];
                    
                    console.log(`✅ Question generated for ${canvasCopy.id}: "${questionData.question}" (correct: option ${questionData.correctAnswer + 1})`);
                  }
                }
                
              } catch (err) {
                console.error(`❌ Error generating question for canvas ${canvasCopy.id}, group ${element.id}:`, err.message);
              }
            }
          }
        }
        
        processedCanvases.push(canvasCopy);
      }
    }

    // Update the project with all processed canvases
    updatedProject.canvases = processedCanvases;

    console.log('=== GENERATION COMPLETE ===');
    console.log(`Total canvases created: ${processedCanvases.length}`);
    console.log(`Background images cached: ${reusableBackgrounds.size}`);
    
    res.json({
      success: true,
      message: `Generated ${processedCanvases.length} canvas${processedCanvases.length > 1 ? 'es' : ''} successfully`,
      updatedProject: updatedProject,
      stats: {
        totalCanvases: processedCanvases.length,
        backgroundImagesCached: reusableBackgrounds.size
      }
    });

  } catch (error) {
    console.error('\n❌ GENERATE API ERROR:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});