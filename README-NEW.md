# DermaLLaMa-GPT - Modern Stack

Modern AI-powered dermatology consultation platform built with React, Node.js, and Google Gemini AI.

## Architecture

### Frontend (React + Vite)
- **React 18** with modern hooks
- **Clerk Authentication** for secure user management
- **Tailwind CSS** for beautiful, responsive UI
- **Axios** for API communication
- **React Router** for navigation

### Backend (Node.js + Express)
- **Express.js** REST API
- **TensorFlow.js** for ML model inference
- **MongoDB** with Mongoose for data storage
- **Google Gemini AI** for chat consultation
- **Clerk SDK** for authentication
- **Multer** for image uploads

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB running locally
- Clerk account with API keys
- Google AI API key

### 1. Backend Setup

```bash
cd backend
npm install
```

Update `.env` file with your keys:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dermallama
GEMINI_API_KEY=your_gemini_api_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Update `.env` file:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

### 3. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5002

## Features

- 🔐 **Secure Authentication** - Clerk-powered user management
- 🤖 **AI Diagnosis** - TensorFlow.js model for 8 skin conditions
- 💬 **AI Consultation** - Gemini AI-powered medical chat
- 📊 **Dashboard** - Track diagnosis history and statistics
- 🎨 **Modern UI** - Beautiful, responsive design
- 🔒 **Data Security** - Encrypted storage and secure API endpoints

## API Endpoints

### Authentication
- `GET /api/auth/verify` - Verify user authentication
- `GET /api/auth/profile` - Get user profile

### Diagnosis
- `POST /api/diagnosis/analyze` - Analyze uploaded image
- `GET /api/diagnosis/history` - Get user's diagnosis history

### Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history/:diagnosisId` - Get chat history

## Detectable Conditions

1. Cellulitis
2. Impetigo
3. Athlete's Foot
4. Nail Fungus
5. Ringworm
6. Cutaneous Larva Migrans
7. Chickenpox
8. Shingles

## Medical Disclaimer

This application is for informational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for proper diagnosis and treatment.

## License

MIT License