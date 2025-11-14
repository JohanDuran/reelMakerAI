# ReelMaker AI Server

A Node.js Express backend following industry-standard MVC architecture for the ReelMaker AI application.

## 🏗️ Architecture

This server follows a clean, modular architecture with clear separation of concerns:

```
server/
├── config/                 # Configuration management
│   └── index.js            # Environment configuration
├── controllers/            # Request handlers (business logic)
│   ├── healthController.js # Health check endpoints
│   └── generationController.js # AI content generation
├── middleware/             # Express middleware functions
│   ├── errorHandler.js     # Error handling and 404
│   ├── logging.js          # Request logging
│   └── validation.js       # Input validation
├── routes/                 # Route definitions
│   └── api.js             # API route configuration
├── services/              # Business logic services
│   ├── contentService.js   # Content generation logic
│   └── openaiService.js    # OpenAI API integration
├── app.js                 # Express app configuration
├── index.js               # Server entry point
└── server.js              # Legacy server file (deprecated)
```

## 🚀 Key Features

### **Modular Design**
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and external API calls
- **Middleware**: Handle cross-cutting concerns (logging, validation, errors)
- **Routes**: Define API endpoints and apply middleware
- **Config**: Centralized configuration management

### **Industry Standards**
- **Separation of Concerns**: Each module has a single responsibility
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Input Validation**: Request validation middleware
- **Security**: Helmet.js for security headers
- **CORS**: Configurable cross-origin resource sharing
- **Logging**: Structured request/response logging

### **AI Content Generation**
- **OpenAI Integration**: Separate service for AI operations
- **Background Caching**: Efficient image reuse with caching
- **Canvas Repetition**: Generate multiple canvases with unique content
- **Question Generation**: AI-powered multiple choice questions

## 📝 API Endpoints

### Health Check
```http
GET /api/health
```
Returns server status and basic information.

### Content Generation
```http
POST /api/generate
```
Generates AI content for project canvases including:
- Multiple choice questions based on topics
- Background images using DALL-E
- Canvas repetition with unique content per copy

## 🔧 Configuration

Environment variables are managed through the config system:

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `OPENAI_API_KEY` - OpenAI API key (required)

## 🚦 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start production server:**
   ```bash
   npm start
   ```

## 📊 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run dev:legacy` - Start legacy server.js (for migration period)

## 🛠️ Development

### Adding New Features

1. **New API Endpoint:**
   - Add controller in `controllers/`
   - Add route in `routes/api.js`
   - Add validation middleware if needed

2. **New Service:**
   - Create service file in `services/`
   - Import in relevant controller
   - Follow dependency injection pattern

3. **New Middleware:**
   - Add middleware in `middleware/`
   - Apply in routes or app.js as needed

### Error Handling

All errors are handled by the centralized error handler:
- Development: Returns detailed error messages
- Production: Returns generic error messages
- All errors are logged with stack traces

### Validation

Input validation is handled by middleware:
- `validateOpenAIKey` - Ensures API key is configured
- `validateProjectData` - Validates request body structure

## 🔄 Migration Notes

The server can run both the new modular architecture (`npm run dev`) and the legacy monolithic server (`npm run dev:legacy`) during the transition period.

## 📈 Performance

- **Background Caching**: Reuses generated images across repeated canvases
- **Efficient Processing**: Parallel processing where possible
- **Memory Management**: Proper cleanup and garbage collection
- **Request Logging**: Structured logging for monitoring and debugging