import express from 'express';
import { getIncomeStatistics } from '../controllers/incomeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/statistics')
  .get(getIncomeStatistics);

export default router;

