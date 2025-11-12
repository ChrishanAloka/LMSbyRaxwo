import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getRoles,
  createRole,
  deleteRole,
  updatePermissions,
  updateCommission
} from '../controllers/employeeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Role routes - MUST come before /:id routes!
router.route('/roles')
  .get(getRoles)
  .post(createRole);

router.route('/roles/:id')
  .delete(deleteRole);

router.route('/:id/permissions')
  .put(updatePermissions);

router.route('/:id/commission')
  .put(updateCommission);

// Employee routes
router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

export default router;
