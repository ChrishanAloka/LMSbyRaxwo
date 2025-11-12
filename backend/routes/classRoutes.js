import express from 'express';
import {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  removeClass,
  startClass,
  startBreak,
  endBreak,
  closeClass
} from '../controllers/classController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/')
  .get(getClasses)
  .post(protect, createClass);

router.route('/:id')
  .get(getClass)
  .put(protect, updateClass)
  .delete(protect, deleteClass);

router.delete('/:id/remove', protect, removeClass);
router.put('/:id/start', protect, startClass);
router.put('/:id/break/start', protect, startBreak);
router.put('/:id/break/end', protect, endBreak);
router.put('/:id/close', protect, closeClass);

export default router;

