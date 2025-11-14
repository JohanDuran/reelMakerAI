import contentService from '../services/contentService.js';

/**
 * Generate AI content for project canvases
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateContent = async (req, res) => {
  try {
    console.log('\n=== GENERATE ENDPOINT HIT ===');
    
    // Clone the project data to modify it
    const updatedProject = JSON.parse(JSON.stringify(req.body));
    
    console.log('Processing canvases with repeat support...');
    
    // Process each canvas and generate repeats
    const allProcessedCanvases = [];
    
    for (const canvas of updatedProject.canvases) {
      const processedCanvases = await contentService.processCanvas(canvas);
      allProcessedCanvases.push(...processedCanvases);
    }

    // Update the project with all processed canvases
    updatedProject.canvases = allProcessedCanvases;
    
    // Get cache statistics
    const stats = {
      totalCanvases: allProcessedCanvases.length,
      ...contentService.getBackgroundCacheStats()
    };

    console.log('=== GENERATION COMPLETE ===');
    console.log(`Total canvases created: ${stats.totalCanvases}`);
    console.log(`Background images cached: ${stats.backgroundImagesCached}`);
    
    res.json({
      success: true,
      message: `Generated ${stats.totalCanvases} canvas${stats.totalCanvases > 1 ? 'es' : ''} successfully`,
      updatedProject: updatedProject,
      stats
    });

  } catch (error) {
    console.error('\n❌ GENERATE API ERROR:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      message: error.message
    });
  }
};