import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to resolve upload file path
const resolveUploadPath = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads/')) {
    return null;
  }
  // Remove leading '/' and join with project root
  const relativePath = imagePath.substring(1); // Remove leading '/'
  return path.join(__dirname, '..', relativePath);
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('conductedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Public
export const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('conductedBy', 'name');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private
export const createSubject = async (req, res) => {
  try {
    const { name, conductedBy, price, description } = req.body;

    // Validate input
    if (!name || !conductedBy || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Use uploaded file path or provided URL
    const image = req.file 
      ? `/uploads/${req.file.filename}`
      : req.body.image;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image'
      });
    }

    // Check if subject already exists
    const subjectExists = await Subject.findOne({ name });
    if (subjectExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject already exists with this name'
      });
    }

    // Create subject
    const subject = await Subject.create({
      name,
      conductedBy,
      price: price || undefined,
      image,
      description
    });

    // Populate the created subject
    await subject.populate('conductedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
export const updateSubject = async (req, res) => {
  try {
    const { name, conductedBy, price, description, status } = req.body;

    let subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Update fields
    if (name) subject.name = name;
    if (conductedBy) subject.conductedBy = conductedBy;
    if (price !== undefined) subject.price = price;
    
    // Handle image: uploaded file or provided URL
    const oldImage = subject.image; // Store old image path before updating
    
    if (req.file) {
      // New file uploaded - delete old image if it was a local file
      const oldImagePath = resolveUploadPath(oldImage);
      if (oldImagePath && fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
          console.log(`Deleted old image file: ${oldImagePath}`);
        } catch (fileError) {
          console.error(`Error deleting old image file: ${fileError.message}`);
          // Continue with update even if old file deletion fails
        }
      }
      subject.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      // If new image URL is provided and it's different from old one, delete old local file
      if (oldImage && oldImage.startsWith('/uploads/') && oldImage !== req.body.image) {
        const oldImagePath = resolveUploadPath(oldImage);
        if (oldImagePath && fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log(`Deleted old image file: ${oldImagePath}`);
          } catch (fileError) {
            console.error(`Error deleting old image file: ${fileError.message}`);
            // Continue with update even if old file deletion fails
          }
        }
      }
      subject.image = req.body.image;
    }
    
    if (description) subject.description = description;
    if (status) subject.status = status;

    await subject.save();

    // Populate before sending response
    await subject.populate('conductedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Delete the image file if it's a local upload
    const imagePath = resolveUploadPath(subject.image);
    if (imagePath) {
      // Check if file exists and delete it
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image file: ${imagePath}`);
        } catch (fileError) {
          console.error(`Error deleting image file: ${fileError.message}`);
          // Continue with subject deletion even if file deletion fails
        }
      } else {
        console.log(`Image file not found at: ${imagePath} (may have been already deleted)`);
      }
    }

    // Delete the subject from database
    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get subjects for a specific teacher
// @route   GET /api/subjects/teacher/:teacherId
// @access  Private
export const getSubjectsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const subjects = await Subject.find({ conductedBy: teacherId })
      .populate('conductedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start a class (subject) - saves to Class table
// @route   POST /api/subjects/:subjectId/start-class
// @access  Private
export const startClass = async (req, res) => {
  try {
    const { id: subjectId } = req.params;
    const currentUserId = req.user._id;
    const userType = req.userType || 'employee';

    const subject = await Subject.findById(subjectId).populate('conductedBy', 'name email');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Admins can start any class, otherwise check if it's their class
    const isAdmin = userType === 'admin';
    const teacherId = subject.conductedBy?._id || subject.conductedBy;
    const isAssignedTeacher = teacherId?.toString() === currentUserId.toString();

    if (!isAdmin && !isAssignedTeacher) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to start this class. Only the assigned teacher can start this class.'
      });
    }

    // Extract date and time from request
    const { date, time } = req.body;
    
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }

    // Create class in database
    const newClass = await Class.create({
      subjectId: subjectId,
      teacherId: teacherId,
      date: date,
      time: time,
      status: 'ongoing'
    });

    // Populate the created class
    await newClass.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: `Class "${subject.name}" started successfully and is now live`,
      data: newClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
