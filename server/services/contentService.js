import openaiService from './openaiService.js';

class ContentService {
  constructor() {
    this.reusableBackgrounds = new Map();
  }

  /**
   * Process a single canvas and generate content
   * @param {Object} canvas - Canvas object to process
   * @returns {Promise<Array>} Array of processed canvases (original + repeats)
   */
  async processCanvas(canvas) {
    const repeatCount = canvas.repeat || 0;
    const totalCanvases = 1 + repeatCount;
    const processedCanvases = [];
    
    console.log(`Processing canvas ${canvas.id}: creating ${totalCanvases} canvas${totalCanvases > 1 ? 'es' : ''} (original + ${repeatCount} repeat${repeatCount !== 1 ? 's' : ''})`);
    
    let sharedBackgroundImage = null;
    
    // Generate shared background if needed
    if (canvas.canvasMeta && canvas.canvasMeta.trim() && canvas.backgroundRepeat) {
      sharedBackgroundImage = await this.getOrGenerateBackground(
        canvas.canvasMeta, 
        canvas.width, 
        canvas.height, 
        true // shared
      );
    }
    
    // Create multiple canvases (original + repeats)
    for (let i = 0; i < totalCanvases; i++) {
      const isOriginal = i === 0;
      const canvasCopy = JSON.parse(JSON.stringify(canvas));
      
      // Update canvas ID for copies
      if (!isOriginal) {
        canvasCopy.id = canvas.id + `_repeat_${i}`;
      }
      
      // Apply background
      await this.applyBackground(canvasCopy, sharedBackgroundImage);
      
      // Process Multiple Option groups
      await this.processMultipleOptionGroups(canvasCopy);
      
      processedCanvases.push(canvasCopy);
    }
    
    return processedCanvases;
  }

  /**
   * Get cached background or generate new one
   * @param {string} prompt - Background description
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {boolean} isShared - Whether this background is shared across canvases
   * @returns {Promise<Object|null>} Background image data or null
   */
  async getOrGenerateBackground(prompt, width, height, isShared = false) {
    const backgroundKey = `${prompt.trim()}_${width}x${height}`;
    
    if (isShared && this.reusableBackgrounds.has(backgroundKey)) {
      console.log(`♻️ Reusing cached background for: "${prompt}"`);
      return this.reusableBackgrounds.get(backgroundKey);
    }
    
    console.log(`🎨 Generating ${isShared ? 'shared' : 'individual'} background: "${prompt}"`);
    
    try {
      const result = await openaiService.generateBackgroundImage(prompt, width, height);
      
      if (isShared) {
        this.reusableBackgrounds.set(backgroundKey, result);
        console.log(`✅ Shared background generated and cached (${result.size}KB)`);
      } else {
        console.log(`✅ Individual background generated (${result.size}KB)`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error generating background:`, error.message);
      return null;
    }
  }

  /**
   * Apply background to a canvas
   * @param {Object} canvas - Canvas to apply background to
   * @param {Object|null} sharedBackground - Shared background if available
   */
  async applyBackground(canvas, sharedBackground) {
    if (sharedBackground) {
      canvas.backgroundSrc = sharedBackground.dataUrl;
      canvas.background = sharedBackground.dataUrl;
    } else if (canvas.canvasMeta && canvas.canvasMeta.trim() && !canvas.backgroundRepeat) {
      const background = await this.getOrGenerateBackground(
        canvas.canvasMeta,
        canvas.width || 450,
        canvas.height || 800,
        false // not shared
      );
      
      if (background) {
        canvas.backgroundSrc = background.dataUrl;
        canvas.background = background.dataUrl;
      }
    }
  }

  /**
   * Process Multiple Option groups in a canvas
   * @param {Object} canvas - Canvas containing groups to process
   */
  async processMultipleOptionGroups(canvas) {
    if (!canvas.elements) return;
    
    for (const element of canvas.elements) {
      if (element.type === 'group' && 
          element.properties && 
          element.properties.name === 'Multiple Option' &&
          element.elements) {
        
        await this.processMultipleOptionGroup(canvas.id, element);
      }
    }
  }

  /**
   * Process a single Multiple Option group
   * @param {string} canvasId - ID of the canvas containing the group
   * @param {Object} group - Group element to process
   */
  async processMultipleOptionGroup(canvasId, group) {
    const aiTopic = group.properties.aiTopic || 'general knowledge';
    console.log(`📝 Generating question content for canvas ${canvasId}, group: ${group.id}, topic: "${aiTopic}"`);
    
    try {
      const questionData = await openaiService.generateQuestion(aiTopic);
      
      // Update group elements with generated content
      let questionUpdated = false;
      let optionIndex = 0;
      
      for (const groupElement of group.elements) {
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

      // Store correct answer info in group properties
      group.properties.correctAnswerIndex = questionData.correctAnswer;
      group.properties.correctAnswerText = questionData.options[questionData.correctAnswer];
      
      console.log(`✅ Question generated for ${canvasId}: "${questionData.question}" (correct: option ${questionData.correctAnswer + 1})`);
      
    } catch (error) {
      console.error(`❌ Error generating question for canvas ${canvasId}, group ${group.id}:`, error.message);
    }
  }

  /**
   * Get statistics about background cache
   * @returns {Object} Cache statistics
   */
  getBackgroundCacheStats() {
    return {
      backgroundImagesCached: this.reusableBackgrounds.size
    };
  }

  /**
   * Clear background cache
   */
  clearBackgroundCache() {
    this.reusableBackgrounds.clear();
  }
}

export default new ContentService();