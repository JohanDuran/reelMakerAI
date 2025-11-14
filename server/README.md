# ReelMaker AI Server

Express.js backend for the ReelMaker AI application.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration values.

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000` by default.

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests (placeholder)

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/projects` - Projects API (placeholder)

## Project Structure

```
server/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── routes/         # API route definitions
├── .env.example    # Environment variables template
├── .gitignore      # Git ignore rules
├── package.json    # Dependencies and scripts
└── server.js       # Main server file
```

## Environment Variables

See `.env.example` for available configuration options.