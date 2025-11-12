import express from 'express';
import {
  getMarks,
  getMarksByStudentId,
  validateStudent,
  createMarks,
  updateMarks,
  deleteMarks
} from '../controllers/marksController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/validate-student/:studentId')
  .get(validateStudent);

router.route('/student/:studentId')
  .get(getMarksByStudentId);

router.route('/')
  .get(getMarks)
  .post(createMarks);

router.route('/:id')
  .put(updateMarks)
  .delete(deleteMarks);

export default router;

