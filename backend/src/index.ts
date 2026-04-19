import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/authRoutes';
import examRoutes from './routes/examRoutes';
import courseRoutes from './routes/courseRoutes';

const app = express();

// Standard Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/courses', courseRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    db_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/examiq';

if (process.env.NODE_ENV !== 'test') {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  // Global connection (safe for serverless caching)
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((err) => {
      console.error('CRITICAL: MongoDB connection failed!');
      console.error(err);
    });

  // Only start Express listener if NOT running in Vercel Serverless
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Examiq Backend running on http://localhost:${PORT}`);
    });
  }
}

export default app;
