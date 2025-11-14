# ReelMaker AI

A full-stack application for creating and editing video reels with AI assistance.

## Project Structure

```
reelMakerAI/
├── client/          # React + TypeScript frontend
│   ├── src/         # Frontend source code
│   ├── public/      # Static assets
│   └── package.json # Frontend dependencies
├── server/          # Express.js backend
│   ├── routes/      # API routes
│   ├── controllers/ # Route handlers
│   ├── middleware/  # Custom middleware
│   └── package.json # Backend dependencies
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Install backend dependencies:
```bash
cd ../server
npm install
```

4. Set up environment variables:
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend:
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Features

- Interactive canvas editor with react-konva
- Multiple canvas support
- Template system (Multiple Option templates)
- Element grouping and management
- Export/Import project functionality
- Element subtypes for semantic organization

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- react-konva (canvas rendering)
- Zustand (state management)
- Material-UI

### Backend
- Express.js
- Node.js
- CORS middleware
- Helmet (security)

## Development

- Frontend runs on port 5173
- Backend runs on port 5000
- Hot reload enabled for both client and server