import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { listExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', protect, listExpenses);
router.post('/', protect, createExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

export default router;


