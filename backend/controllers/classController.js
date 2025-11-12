import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private
export const createClass = async (req, res) => {
  try {
    const { subjectId, teacherId, date, time } = req.body;

    // Validate input
    if (!subjectId || !teacherId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Create class
    const newClass = await Class.create({
      subjectId,
      teacherId,
      date,
      time
    });

    // Populate the class with related data
    await newClass.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Public
export const getClasses = async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    
    // By default, exclude deleted classes. Include them if includeDeleted=true
    const query = includeDeleted === 'true' ? {} : { isDeleted: { $ne: true } };
    
    const classes = await Class.find(query)
      .populate('subjectId', 'name description image')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Public
export const getClass = async (req, res) => {
  try {
    const classInstance = await Class.findById(req.params.id)
      .populate('subjectId', 'name description image')
      .populate('teacherId', 'name email');
    
    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: classInstance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private
export const updateClass = async (req, res) => {
  try {
    const { date, time, status } = req.body;

    let classInstance = await Class.findById(req.params.id);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Update fields
    if (date) classInstance.date = date;
    if (time) classInstance.time = time;
    if (status) classInstance.status = status;

    await classInstance.save();

    // Populate before sending response
    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: classInstance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete class (soft delete - marks as deleted but keeps in view my classes)
// @route   DELETE /api/classes/:id
// @access  Private
export const deleteClass = async (req, res) => {
  try {
    const classInstance = await Class.findById(req.params.id);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classInstance.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Class is already deleted'
      });
    }

    // Soft delete - mark as deleted but keep the record
    classInstance.isDeleted = true;
    classInstance.deletedAt = new Date();
    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully. It will still appear in "View My Classes" until removed.',
      data: classInstance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove class permanently (hard delete from view my classes)
// @route   DELETE /api/classes/:id/remove
// @access  Private
export const removeClass = async (req, res) => {
  try {
    const classInstance = await Class.findById(req.params.id);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Permanently delete the class
    await classInstance.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Class removed permanently'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start break
// @route   PUT /api/classes/:id/break/start
// @access  Private
export const startBreak = async (req, res) => {
  try {
    const classInstance = await Class.findById(req.params.id);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const breakStartTime = new Date();
    classInstance.breakStatus = 'on_break';
    classInstance.breakStartTime = breakStartTime;
    
    // Add new break entry
    if (!classInstance.breaks) {
      classInstance.breaks = [];
    }
    classInstance.breaks.push({
      startTime: breakStartTime
    });

    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Break started',
      data: classInstance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    End break
// @route   PUT /api/classes/:id/break/end
// @access  Private
export const endBreak = async (req, res) => {
  try {
    const classInstance = await Class.findById(req.params.id);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (!classInstance.breakStartTime) {
      return res.status(400).json({
        success: false,
        message: 'No active break to end'
      });
    }

    const breakEndTime = new Date();
    const breakDuration = breakEndTime - classInstance.breakStartTime;

    classInstance.breakStatus = 'class_starting';
    
    // Update the last break entry with end time and duration
    if (classInstance.breaks && classInstance.breaks.length > 0) {
      const lastBreak = classInstance.breaks[classInstance.breaks.length - 1];
      if (!lastBreak.endTime) {
        lastBreak.endTime = breakEndTime;
        lastBreak.duration = breakDuration;
        
        // Update total break duration
        classInstance.totalBreakDuration = (classInstance.totalBreakDuration || 0) + breakDuration;
      }
    }

    classInstance.breakStartTime = null;
    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Break ended',
      data: classInstance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Start class (change status to ongoing)
// @route   PUT /api/classes/:id/start
// @access  Private
export const startClass = async (req, res) => {
  try {
    const classInstance = await Class.findById(req.params.id);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classInstance.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a deleted class'
      });
    }

    if (classInstance.status === 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Class is already started'
      });
    }

    if (classInstance.status === 'completed' || classInstance.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a completed or cancelled class'
      });
    }

    // Change status to ongoing
    classInstance.status = 'ongoing';
    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Class started successfully',
      data: classInstance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Close class and mark attendance
// @route   PUT /api/classes/:id/close
// @access  Private
export const closeClass = async (req, res) => {
  try {
    const classInstance = await Class.findById(req.params.id);

    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (classInstance.status === 'completed' || classInstance.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Class is already closed or cancelled'
      });
    }

    // Import Attempt model
    const Attempt = (await import('../models/Attempt.js')).default;

    // Mark all ACTIVE attempts as attended (students who haven't left)
    const attendedResult = await Attempt.updateMany(
      { 
        classId: req.params.id,
        status: 'active' // Only mark active attempts as attended
      },
      { 
        attendance: 'attended',
        attendanceMarkedAt: new Date()
      }
    );

    // Mark all LEFT attempts as absent (students who left before class closed)
    const absentResult = await Attempt.updateMany(
      { 
        classId: req.params.id,
        status: 'left' // Students who left are marked as absent
      },
      { 
        attendance: 'absent',
        attendanceMarkedAt: new Date()
      }
    );

    // Update class status to completed
    classInstance.status = 'completed';
    
    // End break if still on break
    if (classInstance.breakStatus === 'on_break' && classInstance.breakStartTime) {
      const breakEndTime = new Date();
      const breakDuration = breakEndTime - classInstance.breakStartTime;

      if (classInstance.breaks && classInstance.breaks.length > 0) {
        const lastBreak = classInstance.breaks[classInstance.breaks.length - 1];
        if (!lastBreak.endTime) {
          lastBreak.endTime = breakEndTime;
          lastBreak.duration = breakDuration;
          classInstance.totalBreakDuration = (classInstance.totalBreakDuration || 0) + breakDuration;
        }
      }
      classInstance.breakStatus = 'none';
      classInstance.breakStartTime = null;
    }

    await classInstance.save();

    await classInstance.populate([
      { path: 'subjectId', select: 'name description image' },
      { path: 'teacherId', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Class closed successfully. Attendance marked for active students.',
      data: classInstance,
      attendance: {
        attended: attendedResult.modifiedCount,
        absent: absentResult.modifiedCount,
        message: `${attendedResult.modifiedCount} student(s) marked as attended, ${absentResult.modifiedCount} student(s) marked as absent`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

