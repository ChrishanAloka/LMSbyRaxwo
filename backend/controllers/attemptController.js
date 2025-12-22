import Attempt from '../models/Attempt.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
import { sendClassAttemptSMS } from '../services/smsService.js';

// @desc    Attempt a class (student joins)
// @route   POST /api/attempts
// @access  Public
export const attemptClass = async (req, res) => {
  try {
    const { classId, studentId, studentName } = req.body;

    // Validate input - studentId and studentName can be the same value (single input field)
    if (!classId || !studentId || !studentId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide class ID and student ID or name'
      });
    }

    // Use the same input value for both ID and name search
    const searchValue = studentId.trim();

    // Verify class exists and populate subject
    const classInstance = await Class.findById(classId).populate('subjectId', 'name');
    if (!classInstance) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify student exists by ID OR by name (single input field - can be ID or name)
    // First try to find by student ID
    let student = await Student.findOne({ studentId: searchValue }).select('name email studentId mobile firstName lastName');
    
    // If not found by ID, try to find by name (first name, last name, or full name)
    if (!student) {
      const enteredName = searchValue.toLowerCase();
      const allStudents = await Student.find().select('name email studentId mobile firstName lastName');
      
      // Find student by matching name (first name, last name, or full name)
      student = allStudents.find(s => {
        const studentNameLower = (s.name || '').trim().toLowerCase();
        const nameParts = studentNameLower.split(/\s+/).filter(part => part.length > 0);
        const firstName = nameParts.length > 0 ? nameParts[0] : '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const fullName = studentNameLower;
        
        // Check if entered name matches first name, last name, or full name
        const matchesFirstName = firstName && enteredName === firstName;
        const matchesLastName = lastName && enteredName === lastName;
        const matchesFullName = enteredName === fullName;
        
        // Also check if entered name matches reversed full name
        const enteredParts = enteredName.split(/\s+/).filter(part => part.length > 0);
        const matchesReversed = enteredParts.length === nameParts.length && 
          enteredParts.length === 2 &&
          enteredParts[0] === nameParts[1] && 
          enteredParts[1] === nameParts[0];
        
        return matchesFirstName || matchesLastName || matchesFullName || matchesReversed;
      });
    }
    
    // If student still not found, reject the attempt
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Please check that your Student ID or Name is registered in the system.'
      });
    }
    
    // Ensure mobile number exists
    if (!student.mobile || student.mobile.trim() === '') {
      console.error('❌ Student mobile number is missing or empty:', {
        studentId: student.studentId,
        name: student.name,
        mobile: student.mobile
      });
      // Continue without SMS - don't fail the request
    }
    
    console.log('Student found for SMS:', { 
      name: student.name, 
      studentId: student.studentId,
      mobile: student.mobile,
      mobileType: typeof student.mobile,
      mobileLength: student.mobile ? student.mobile.length : 0,
      mobileExists: !!student.mobile
    });

    // Check if class is deleted
    if (classInstance.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'This class has been deleted'
      });
    }

    // Check if student already has an active attempt for this class
    // Use the found student's ID (not the input ID, in case student was found by name)
    const existingAttempt = await Attempt.findOne({ 
      classId: classId, 
      studentId: student.studentId,
      status: 'active'
    });
    
    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this class'
      });
    }

    // Check if student previously left this class - if so, check if class is closed
    // Use the found student's ID (not the input ID, in case student was found by name)
    const leftAttempt = await Attempt.findOne({
      classId: classId,
      studentId: student.studentId,
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

      // Send SMS notification (only for new attempts, not reactivations)
      try {
        console.log('=== SMS SENDING ATTEMPT ===');
        console.log('Student:', student.name);
        console.log('Student ID:', student.studentId);
        console.log('Mobile Number:', student.mobile);
        console.log('Mobile Number Type:', typeof student.mobile);
        console.log('Class Instance:', {
          id: classInstance._id,
          subjectId: classInstance.subjectId,
          subjectName: classInstance.subjectId?.name || 'N/A'
        });
        
        const smsResult = await sendClassAttemptSMS(student, classInstance);
        
        console.log('=== SMS RESULT ===');
        console.log('SMS Success:', smsResult.success);
        console.log('SMS Data:', smsResult.data);
        console.log('SMS Error:', smsResult.error);
        console.log('==================');
        
        if (!smsResult.success) {
          console.error('SMS failed but request continues. Error:', smsResult.error);
        }
      } catch (smsError) {
        // Log SMS error but don't fail the request
        console.error('=== SMS EXCEPTION ===');
        console.error('Failed to send SMS notification:', smsError);
        console.error('Error Stack:', smsError.stack);
        console.error('=====================');
      }
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

// @desc    Get student weekly or monthly attendance by student ID or name, grouped by subject
// @route   GET /api/attempts/attendance/weekly
// @access  Public
export const getStudentWeeklyAttendance = async (req, res) => {
  try {
    const { studentId, studentName, period = 'weekly' } = req.query;

    // Validate input
    if (!studentId && !studentName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either student ID or student name'
      });
    }

    // Validate period
    if (period !== 'weekly' && period !== 'monthly') {
      return res.status(400).json({
        success: false,
        message: 'Period must be either "weekly" or "monthly"'
      });
    }

    // Find student by ID or name - try both if needed
    let student;
    if (studentId) {
      // First try exact match by studentId
      student = await Student.findOne({ studentId: studentId });
      // If not found, try case-insensitive search
      if (!student) {
        student = await Student.findOne({ 
          studentId: { $regex: `^${studentId}$`, $options: 'i' } 
        });
      }
    } else if (studentName) {
      // Try searching by name first
      student = await Student.findOne({ 
        name: { $regex: studentName, $options: 'i' } 
      });
      // If not found by name, also try searching by studentId (in case user entered ID as name)
      if (!student) {
        student = await Student.findOne({ 
          studentId: { $regex: `^${studentName}$`, $options: 'i' } 
        });
      }
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Please check the student ID or name and try again.'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    if (period === 'weekly') {
      // Calculate start and end of current week (Monday to Sunday)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
      startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Calculate start and end of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get all attempts for this student in the date range
    const attempts = await Attempt.find({
      studentId: student.studentId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate({
        path: 'classId',
        select: 'subjectId teacherId date time status',
        populate: [
          {
            path: 'subjectId',
            select: 'name'
          },
          {
            path: 'teacherId',
            select: 'name'
          }
        ]
      })
      .sort({ createdAt: -1 });

    // Group attempts by subject
    const attendanceBySubject = {};
    
    attempts.forEach(attempt => {
      const subjectId = attempt.classId?.subjectId?._id?.toString() || 'unknown';
      const subjectName = attempt.classId?.subjectId?.name || 'Unknown Subject';
      
      if (!attendanceBySubject[subjectId]) {
        attendanceBySubject[subjectId] = {
          subjectId: subjectId,
          subjectName: subjectName,
          classes: [],
          statistics: {
            total: 0,
            attended: 0,
            absent: 0,
            pending: 0
          }
        };
      }
      
      attendanceBySubject[subjectId].classes.push(attempt);
      attendanceBySubject[subjectId].statistics.total++;
      
      if (attempt.attendance === 'attended') {
        attendanceBySubject[subjectId].statistics.attended++;
      } else if (attempt.attendance === 'absent') {
        attendanceBySubject[subjectId].statistics.absent++;
      } else {
        attendanceBySubject[subjectId].statistics.pending++;
      }
    });

    // Convert to array and sort by subject name
    const subjectsArray = Object.values(attendanceBySubject).sort((a, b) => 
      a.subjectName.localeCompare(b.subjectName)
    );

    // Calculate overall statistics
    const totalClasses = attempts.length;
    const attendedCount = attempts.filter(a => a.attendance === 'attended').length;
    const absentCount = attempts.filter(a => a.attendance === 'absent').length;
    const pendingCount = attempts.filter(a => a.attendance === 'pending' || !a.attendance).length;

    res.status(200).json({
      success: true,
      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email
      },
      period: period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      overallStatistics: {
        totalClasses,
        attended: attendedCount,
        absent: absentCount,
        pending: pendingCount
      },
      attendanceBySubject: subjectsArray,
      data: attempts // Keep for backward compatibility
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

