import Attempt from '../models/Attempt.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';

// @desc    Attempt a class (student joins)
// @route   POST /api/attempts
// @access  Public
export const attemptClass = async (req, res) => {
  try {
    const { classId, studentId } = req.body;

    // Validate input
    if (!classId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide class ID and student ID'
      });
    }

    // Verify class exists
    const classInstance = await Class.findById(classId);
    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify student exists
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Invalid student ID'
      });
    }

    // Check if class is deleted
    if (classInstance.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'This class has been deleted'
      });
    }

    // Check if student already has an active attempt for this class
    const existingAttempt = await Attempt.findOne({ 
      classId: classId, 
      studentId: studentId,
      status: 'active'
    });
    
    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this class'
      });
    }

    // Check if student previously left this class - if so, check if class is closed
    const leftAttempt = await Attempt.findOne({
      classId: classId,
      studentId: studentId,
      status: 'left'
    });

    // If student left and class is closed, they cannot rejoin (attendance already saved)
    if (leftAttempt && classInstance.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You cannot rejoin this class as it has been closed and your attendance has been recorded'
      });
    }

    let attempt;
    if (leftAttempt) {
      // Reactivate the previous attempt (only if class is not closed)
      leftAttempt.status = 'active';
      leftAttempt.leftAt = null;
      leftAttempt.studentName = student.name;
      leftAttempt.studentEmail = student.email;
      await leftAttempt.save();
      attempt = leftAttempt;
    } else {
      // Create new attempt
      attempt = await Attempt.create({
        classId,
        studentId: student.studentId,
        studentName: student.name,
        studentEmail: student.email,
        status: 'active'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Class attempted successfully',
      data: attempt
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this class'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Leave a class (student leaves) - marks as left instead of deleting
// @route   PUT /api/attempts/:classId/:studentId/leave
// @access  Public
export const leaveClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    // Find and update the attempt status to 'left'
    const attempt = await Attempt.findOne({
      classId: classId,
      studentId: studentId,
      status: 'active'
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Active attempt not found'
      });
    }

    // Check if class is closed - if so, mark attendance as absent
    const Class = (await import('../models/Class.js')).default;
    const classInstance = await Class.findById(classId);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Mark as left
    attempt.status = 'left';
    attempt.leftAt = new Date();

    // If class is already closed, mark attendance as absent
    if (classInstance.status === 'completed') {
      attempt.attendance = 'absent';
      attempt.attendanceMarkedAt = new Date();
    }
    // If class is not closed, attendance remains pending (student can rejoin)

    await attempt.save();

    res.status(200).json({
      success: true,
      message: classInstance.status === 'completed' 
        ? 'Left class successfully. Your attendance has been marked as absent.'
        : 'Left class successfully. You can rejoin if the class is still ongoing.',
      data: attempt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attempts for a class
// @route   GET /api/attempts/class/:classId
// @access  Public
export const getClassAttempts = async (req, res) => {
  try {
    const { classId } = req.params;
    const { status } = req.query; // Optional filter by status

    const query = { classId };
    if (status) {
      query.status = status;
    }

    const attempts = await Attempt.find(query)
      .sort({ createdAt: -1 });

    // Count only active attempts by default
    const activeCount = status === 'active' || !status 
      ? await Attempt.countDocuments({ classId, status: 'active' })
      : attempts.length;

    res.status(200).json({
      success: true,
      count: status ? attempts.length : activeCount, // Return active count if no status filter
      activeCount: await Attempt.countDocuments({ classId, status: 'active' }),
      leftCount: await Attempt.countDocuments({ classId, status: 'left' }),
      totalCount: await Attempt.countDocuments({ classId }),
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check if student attempted a class (checks for active attempts)
// @route   GET /api/attempts/check/:classId/:studentId
// @access  Public
export const checkAttempt = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const attempt = await Attempt.findOne({
      classId: classId,
      studentId: studentId,
      status: 'active' // Only check for active attempts
    });

    res.status(200).json({
      success: true,
      attempted: !!attempt,
      isActive: !!attempt,
      data: attempt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all attempts by student ID
// @route   GET /api/attempts/student/:studentId
// @access  Public
export const getStudentAttempts = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.query; // Optional filter by status

    const query = { studentId };
    if (status) {
      query.status = status;
    }

    const attempts = await Attempt.find(query)
      .populate('classId', 'subjectId teacherId date time status breakStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      activeCount: await Attempt.countDocuments({ studentId, status: 'active' }),
      leftCount: await Attempt.countDocuments({ studentId, status: 'left' }),
      totalCount: await Attempt.countDocuments({ studentId }),
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all attempts for reporting (all statuses)
// @route   GET /api/attempts/report
// @access  Public
export const getAllAttemptsReport = async (req, res) => {
  try {
    const { classId, studentId, status } = req.query;

    const query = {};
    if (classId) query.classId = classId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    const attempts = await Attempt.find(query)
      .populate('classId', 'subjectId teacherId date time status breakStatus')
      .sort({ createdAt: -1 });

    const stats = {
      total: await Attempt.countDocuments(query),
      active: await Attempt.countDocuments({ ...query, status: 'active' }),
      left: await Attempt.countDocuments({ ...query, status: 'left' })
    };

    res.status(200).json({
      success: true,
      count: attempts.length,
      stats,
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

