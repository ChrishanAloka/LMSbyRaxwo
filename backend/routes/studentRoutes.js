import express from 'express';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  searchStudentsForAutocomplete
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for student autocomplete (must be before protect middleware)
router.get('/search/autocomplete', searchStudentsForAutocomplete);

// All other routes require authentication
router.use(protect);

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

export default router;

