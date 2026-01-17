import express from 'express';
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  checkExamByStudent
} from '../controllers/examController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// IMPORTANT: Define public routes BEFORE any protected routes
// Public routes for client exam registration - NO authentication required

// Helper endpoint to check if exam exists for a student (must be before /:id route)
router.get('/student/:studentId', checkExamByStudent);

// Public GET and POST routes - both admin and client can access
router.get('/', getExams);  // Public access - both admin and client can view
router.post('/', createExam);  // Public access - both admin and client can create

// Public GET single exam route
router.get('/:id', getExam);  // Public access for viewing

// Protected routes - only admin can edit/delete (must be after public routes)
router.put('/:id', protect, updateExam);
router.delete('/:id', protect, deleteExam);

export default router;

