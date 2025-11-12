import express from 'express';
import {
  getExtraIncomes,
  getExtraIncome,
  createExtraIncome,
  updateExtraIncome,
  deleteExtraIncome
} from '../controllers/extraIncomeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getExtraIncomes)
  .post(createExtraIncome);

router.route('/:id')
  .get(getExtraIncome)
  .put(updateExtraIncome)
  .delete(deleteExtraIncome);

export default router;

