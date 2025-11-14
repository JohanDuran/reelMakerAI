import OpenAI from 'openai';
import { config } from '../config/index.js';

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Generate a multiple choice question using GPT
   * @param {string} topic - The topic for the question
   * @returns {Promise<Object>} Generated question data
   */
  async generateQuestion(topic = 'general knowledge') {
    const prompt = `Generate a multiple choice question about "${topic}". Return only valid JSON in this exact format:
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

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        max_tokens: 300,
        temperature: 0.7
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

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

      // Validate response structure
      if (!questionData.question || !questionData.options || !Array.isArray(questionData.options) || 
          questionData.options.length !== 4 || typeof questionData.correctAnswer !== 'number') {
        throw new Error('Invalid question data structure from OpenAI');
      }

      return questionData;
    } catch (error) {
      console.error('Error generating question:', error.message);
      throw error;
    }
  }

  /**
   * Generate a background image using DALL-E
   * @param {string} prompt - Description for the background image
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Promise<string>} Base64 data URL of the generated image
   */
  async generateBackgroundImage(prompt, width = 450, height = 800) {
    try {
      // Determine optimal image size based on canvas dimensions
      const aspectRatio = width / height;
      let imageSize = '1024x1024'; // default square
      
      if (aspectRatio > 1.5) {
        imageSize = '1792x1024'; // landscape
      } else if (aspectRatio < 0.7) {
        imageSize = '1024x1792'; // portrait
      }

      const backgroundPrompt = `Create a background image: ${prompt}. Make it suitable as a background with good contrast for text overlays.`;
      
      const imageResponse = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: backgroundPrompt,
        size: imageSize,
        quality: 'standard',
        n: 1
      });
      
      if (!imageResponse.data || !imageResponse.data[0] || !imageResponse.data[0].url) {
        throw new Error('No image URL returned from DALL-E');
      }

      // Download and convert to data URL
      const imageDownloadResponse = await fetch(imageResponse.data[0].url);
      if (!imageDownloadResponse.ok) {
        throw new Error(`Failed to download image: ${imageDownloadResponse.status}`);
      }
      
      const imageBuffer = await imageDownloadResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageDownloadResponse.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      
      return {
        dataUrl,
        size: Math.round(imageBuffer.byteLength / 1024) // Size in KB
      };
    } catch (error) {
      console.error('Error generating background image:', error.message);
      throw error;
    }
  }
}

export default new OpenAIService();