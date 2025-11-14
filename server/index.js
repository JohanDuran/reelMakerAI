import app from './app.js';
import { config } from './config/index.js';

// Start the server
app.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/api/health`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📱 Client URL: ${config.clientUrl}`);
});