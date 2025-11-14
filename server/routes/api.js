import express from 'express';
import { getHealth } from '../controllers/healthController.js';
import { generateContent } from '../controllers/generationController.js';
import { validateOpenAIKey, validateProjectData } from '../middleware/validation.js';

const router = express.Router();

// Health check route
router.get('/health', getHealth);

// Content generation route
router.post('/generate', 
  validateOpenAIKey,
  validateProjectData,
  generateContent
);

// Placeholder for future projects API
router.use('/projects', (req, res) => {
  res.json({ 
    message: 'Projects API endpoint',
    note: 'This endpoint is reserved for future project management features'
  });
});

export default router;