import express from 'express';
import {
  createPayment,
  getPayments,
  getPayment,
  getPaymentsByStudent,
  updatePayment,
  deletePayment
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/student/:studentId')
  .get(getPaymentsByStudent);

router.route('/:id')
  .get(getPayment)
  .put(updatePayment)
  .delete(deletePayment);

export default router;

