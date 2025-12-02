import express from 'express';
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam
} from '../controllers/examController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExams)
  .post(protect, createExam);

router.route('/:id')
  .get(protect, getExam)
  .put(protect, updateExam)
  .delete(protect, deleteExam);

export default router;

