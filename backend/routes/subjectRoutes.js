import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByTeacher,
  startClass
} from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';

// Configure Multer for file uploads - using memory storage for S3
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

const router = express.Router();

// Public routes
router.route('/')
  .get(getSubjects)
  .post(protect, upload.single('image'), createSubject);

router.route('/teacher/:teacherId')
  .get(protect, getSubjectsByTeacher);

// This route MUST come before /:id to prevent "start-class" from being treated as an ID
router.route('/:id/start-class')
  .post(protect, startClass);

router.route('/:id')
  .get(getSubject)
  .put(protect, upload.single('image'), updateSubject)
  .delete(protect, deleteSubject);

export default router;

