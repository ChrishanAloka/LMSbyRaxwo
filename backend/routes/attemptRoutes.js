import express from 'express';
import {
  attemptClass,
  leaveClass,
  getClassAttempts,
  checkAttempt,
  getStudentAttempts,
  getAllAttemptsReport
} from '../controllers/attemptController.js';

const router = express.Router();

// Public routes
router.post('/', attemptClass);
router.put('/:classId/:studentId/leave', leaveClass); // Changed from DELETE to PUT
router.get('/class/:classId', getClassAttempts);
router.get('/check/:classId/:studentId', checkAttempt);
router.get('/student/:studentId', getStudentAttempts);
router.get('/report', getAllAttemptsReport); // Get all attempts for reporting

export default router;

