import { connectDB } from "./config/db.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import classRoutes from './routes/classRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import extraIncomeRoutes from './routes/extraIncomeRoutes.js';
import marksRoutes from './routes/marksRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import examRoutes from './routes/examRoutes.js';
import { testS3Upload, testS3Delete } from './controllers/testS3Controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://lms-tili.onrender.com',
      // Add your production frontend URLs here when deployed
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now - change to callback(new Error('Not allowed by CORS')) in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight request for 10 minutes
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Make uploads directory if it doesn't exist
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/employees', employeeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/extra-income', extraIncomeRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exams', examRoutes);

// Test routes for S3 (remove in production)
app.post('/api/test/s3-upload', testS3Upload);
app.delete('/api/test/s3-delete', testS3Delete);

// Connect to Database
connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`);
});