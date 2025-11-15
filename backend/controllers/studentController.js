import Student from '../models/Student.js';
import Subject from '../models/Subject.js';

// @desc    Get all students
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('subjects', 'name price')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('subjects', 'name price');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private
export const createStudent = async (req, res) => {
  try {
    const {
      name,
      studentId,
      email,
      birthday,
      gender,
      mobile,
      subjects,
      hasSpecialNeeds,
      specialNeedsDetails,
      guardianName,
      guardianTelephone,
      paymentType
    } = req.body;

    // Validate required fields
    if (!name || !studentId || !email || !birthday || !gender || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if student already exists
    const studentExists = await Student.findOne({
      $or: [
        { studentId },
        { email }
      ]
    });

    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this Student ID or Email'
      });
    }

    // Calculate total price if subjects are provided
    let totalPrice = 0;
    if (subjects && subjects.length > 0) {
      const subjectDocs = await Subject.find({ _id: { $in: subjects } });
      totalPrice = subjectDocs.reduce((sum, subject) => sum + (subject.price || 0), 0);
    }

    // Create student
    const student = await Student.create({
      name,
      studentId,
      email,
      birthday,
      gender,
      mobile,
      subjects: subjects || [],
      hasSpecialNeeds: hasSpecialNeeds || false,
      specialNeedsDetails: hasSpecialNeeds ? specialNeedsDetails : undefined,
      guardianName: hasSpecialNeeds ? guardianName : undefined,
      guardianTelephone: hasSpecialNeeds ? guardianTelephone : undefined,
      paymentType: paymentType || undefined,
      totalPrice
    });

    // Populate subjects before sending response
    await student.populate('subjects', 'name price');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
export const updateStudent = async (req, res) => {
  try {
    const {
      name,
      studentId,
      email,
      birthday,
      gender,
      mobile,
      subjects,
      hasSpecialNeeds,
      specialNeedsDetails,
      guardianName,
      guardianTelephone,
      paymentType
    } = req.body;

    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if studentId or email is being changed and if it conflicts
    if (studentId && studentId !== student.studentId) {
      const studentIdExists = await Student.findOne({ studentId, _id: { $ne: student._id } });
      if (studentIdExists) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    if (email && email !== student.email) {
      const emailExists = await Student.findOne({ email, _id: { $ne: student._id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Calculate total price if subjects are provided
    let totalPrice = student.totalPrice;
    if (subjects !== undefined) {
      if (subjects.length > 0) {
        const subjectDocs = await Subject.find({ _id: { $in: subjects } });
        totalPrice = subjectDocs.reduce((sum, subject) => sum + (subject.price || 0), 0);
      } else {
        totalPrice = 0;
      }
    }

    // Update fields
    if (name) student.name = name;
    if (studentId) student.studentId = studentId;
    if (email) student.email = email;
    if (birthday) student.birthday = birthday;
    if (gender) student.gender = gender;
    if (mobile) student.mobile = mobile;
    if (subjects !== undefined) {
      student.subjects = subjects;
      student.totalPrice = totalPrice;
    }
    if (hasSpecialNeeds !== undefined) student.hasSpecialNeeds = hasSpecialNeeds;
    if (specialNeedsDetails !== undefined) student.specialNeedsDetails = specialNeedsDetails;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianTelephone !== undefined) student.guardianTelephone = guardianTelephone;
    if (paymentType) student.paymentType = paymentType;

    await student.save();

    // Populate subjects before sending response
    await student.populate('subjects', 'name price');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

