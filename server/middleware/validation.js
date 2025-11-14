import { config } from '../config/index.js';

/**
 * Validate OpenAI API key is configured
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const validateOpenAIKey = (req, res, next) => {
  if (!config.openai.apiKey) {
    console.log('❌ OpenAI API key not found');
    return res.status(400).json({ 
      error: 'OpenAI API key not configured'
    });
  }
  next();
};

/**
 * Validate project data in request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const validateProjectData = (req, res, next) => {
  if (!req.body || !req.body.canvases) {
    console.log('❌ No project data received');
    return res.status(400).json({
      error: 'No project data received',
      expected: 'Request body should contain project data with canvases array'
    });
  }
  next();
};