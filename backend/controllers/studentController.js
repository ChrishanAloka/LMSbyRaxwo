import Student from '../models/Student.js';
import Subject from '../models/Subject.js';

// @desc    Get all students
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price')
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
      .populate('subjects', 'name price')
      .populate('subjectPrices.subjectId', 'name price');
    
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
      subjectPrices,
      totalPrice,
      hasSpecialNeeds,
      specialNeed,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      paymentType,
      registrationDate
    } = req.body;

    // Validate required fields (studentId is now optional as it will be auto-generated)
    if (!name || !email || !birthday || !gender || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate registration date if provided
    let finalRegistrationDate = undefined;
    if (registrationDate) {
      if (typeof registrationDate === 'string' && registrationDate.trim()) {
        const dateValue = new Date(registrationDate);
        if (isNaN(dateValue.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid registration date format'
          });
        }
        finalRegistrationDate = dateValue;
      } else if (registrationDate instanceof Date) {
        finalRegistrationDate = registrationDate;
      }
    }

    // Auto-generate student ID if not provided
    let finalStudentId = studentId;
    if (!finalStudentId || finalStudentId.trim() === '') {
      // Find the highest existing student ID with format ID####
      const existingStudents = await Student.find({
        studentId: { $regex: /^ID\d{4}$/ }
      }).sort({ studentId: -1 }).limit(1);

      let nextNumber = 1;
      if (existingStudents.length > 0) {
        // Extract the number from the highest ID (e.g., "ID0005" -> 5)
        const lastId = existingStudents[0].studentId;
        const lastNumber = parseInt(lastId.replace('ID', ''), 10);
        nextNumber = lastNumber + 1;
      }

      // Format as ID#### (4 digits with leading zeros)
      finalStudentId = `ID${String(nextNumber).padStart(4, '0')}`;
    }

    // Check if student ID already exists (email can be duplicate for family members)
    const studentExists = await Student.findOne({
      studentId: finalStudentId
    });

    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this Student ID'
      });
    }

    // Process subjectPrices: calculate totalPrice from subjectPrices if provided
    let finalSubjectPrices = [];
    let finalTotalPrice = 0;

    if (subjectPrices && Array.isArray(subjectPrices) && subjectPrices.length > 0) {
      // Use subjectPrices to calculate total
      // Use parseFloat to preserve exact decimal values
      finalSubjectPrices = subjectPrices.map(sp => ({
        subjectId: sp.subjectId,
        price: parseFloat(sp.price) || 0
      }));
      finalTotalPrice = finalSubjectPrices.reduce((sum, sp) => sum + sp.price, 0);
    } else if (totalPrice !== undefined) {
      // Fallback: use provided totalPrice if subjectPrices not provided
      finalTotalPrice = Number(totalPrice) || 0;
    }

    // Create student
    // Note: Email uniqueness is not enforced - allows multiple students (family members) to share the same email
    let student;
    try {
      student = await Student.create({
        name,
        studentId: finalStudentId,
        email,
        birthday,
        gender,
        mobile,
        subjects: subjects || [],
        subjectPrices: finalSubjectPrices,
        hasSpecialNeeds: hasSpecialNeeds || false,
        specialNeed: hasSpecialNeeds ? specialNeed : undefined,
        specialNeedsDetails: hasSpecialNeeds ? specialNeedsDetails : undefined,
        guardianFirstName: hasSpecialNeeds ? guardianFirstName : undefined,
        guardianLastName: hasSpecialNeeds ? guardianLastName : undefined,
        guardianTelephone: hasSpecialNeeds ? guardianTelephone : undefined,
        paymentType: paymentType || undefined,
        totalPrice: finalTotalPrice,
        registrationDate: finalRegistrationDate
      });
    } catch (createError) {
      // If error is due to duplicate email (unique index still exists in database)
      if (createError.code === 11000 && createError.keyPattern && createError.keyPattern.email) {
        return res.status(400).json({
          success: false,
          message: 'The database still has a unique constraint on email. Please run the script: node scripts/removeEmailUniqueIndex.js (or manually drop the index in MongoDB)'
        });
      }
      throw createError; // Re-throw if it's a different error
    }

    // Populate subjects before sending response
    await student.populate('subjects', 'name price');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key errors (unique constraint violations)
    // Note: Email is no longer unique (allows family members to share email)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      let message = 'Duplicate entry';
      
      if (field === 'studentId') {
        message = 'This Student ID already exists. Please use a different Student ID.';
      } else {
        message = `${field} already exists`;
      }
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      subjectPrices,
      totalPrice,
      hasSpecialNeeds,
      specialNeed,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      paymentType,
      registrationDate
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

    // Email can be duplicate for family members (siblings), so no duplicate check needed

    // Update fields
    if (name) student.name = name;
    if (studentId) student.studentId = studentId;
    if (email) student.email = email;
    if (birthday) student.birthday = birthday;
    if (gender) student.gender = gender;
    if (mobile) student.mobile = mobile;
    if (subjects !== undefined) {
      student.subjects = subjects;
    }
    
    // Process subjectPrices: calculate totalPrice from subjectPrices if provided
    if (subjectPrices !== undefined && Array.isArray(subjectPrices) && subjectPrices.length > 0) {
      // Use parseFloat to preserve exact decimal values
      student.subjectPrices = subjectPrices.map(sp => ({
        subjectId: sp.subjectId,
        price: parseFloat(sp.price) || 0
      }));
      student.totalPrice = student.subjectPrices.reduce((sum, sp) => sum + sp.price, 0);
    } else if (totalPrice !== undefined) {
      // Fallback: use provided totalPrice if subjectPrices not provided
      student.totalPrice = Number(totalPrice);
    }
    
    if (hasSpecialNeeds !== undefined) student.hasSpecialNeeds = hasSpecialNeeds;
    if (specialNeed !== undefined) student.specialNeed = specialNeed;
    if (specialNeedsDetails !== undefined) student.specialNeedsDetails = specialNeedsDetails;
    if (guardianFirstName !== undefined) student.guardianFirstName = guardianFirstName;
    if (guardianLastName !== undefined) student.guardianLastName = guardianLastName;
    if (guardianTelephone !== undefined) student.guardianTelephone = guardianTelephone;
    if (paymentType) student.paymentType = paymentType;
    if (registrationDate !== undefined && registrationDate !== null && registrationDate !== '') {
      // Validate date format
      const dateValue = new Date(registrationDate);
      if (!isNaN(dateValue.getTime())) {
        student.registrationDate = dateValue;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid registration date format'
        });
      }
    } else if (registrationDate === null || registrationDate === '') {
      // Allow clearing the registration date
      student.registrationDate = undefined;
    }

    await student.save();

    // Populate subjects before sending response
    await student.populate('subjects', 'name price');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key errors (unique constraint violations)
    // Note: Email is no longer unique (allows family members to share email)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      let message = 'Duplicate entry';
      
      if (field === 'studentId') {
        message = 'This Student ID already exists. Please use a different Student ID.';
      } else {
        message = `${field} already exists`;
      }
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update student',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// @desc    Search students for autocomplete (public endpoint)
// @route   GET /api/students/search/autocomplete
// @access  Public
export const searchStudentsForAutocomplete = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const searchTerm = query.trim().toLowerCase();
    
    // Find students by ID or name (partial match)
    const students = await Student.find({
      $or: [
        { studentId: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .select('name studentId email')
    .limit(10)
    .sort({ studentId: 1 });

    // Format results similar to PaymentPage front-end logic
    const suggestions = students.map(student => ({
      _id: student._id,
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      displayText: `${student.name} (ID: ${student.studentId})`
    }));

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

