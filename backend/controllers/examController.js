import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
      .populate('exams.subjectId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
export const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
      .populate('exams.subjectId', 'name');
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create exam
// @route   POST /api/exams
// @access  Private
export const createExam = async (req, res) => {
  try {
    const {
      studentId,
      studentIdNumber,
      title,
      firstName,
      lastName,
      otherNames,
      familyName,
      email,
      dateOfBirth,
      birthDay,
      birthMonth,
      birthYear,
      gender,
      telephone,
      mobile,
      specialNeeds,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      guardianMobile,
      ukVisa,
      exams,
      candidateIdNumber,
      examDate
    } = req.body;

    // Validate required fields
    if (!studentId || !studentIdNumber || !firstName || !lastName || !exams || !Array.isArray(exams) || exams.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including first name, last name, and at least one exam'
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate and process exams
    const processedExams = [];
    for (const examItem of exams) {
      if (!examItem.subjectId) {
        return res.status(400).json({
          success: false,
          message: 'Each exam must have a subjectId'
        });
      }

      // Validate subject exists
      const subject = await Subject.findById(examItem.subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: `Subject with ID ${examItem.subjectId} not found`
        });
      }

      processedExams.push({
        subjectId: subject._id,
        subjectName: subject.name
      });
    }

    // Check if exam record already exists for this student
    // Check by both studentId (ObjectId) and studentIdNumber (string)
    const existingExam = await Exam.findOne({
      $or: [
        { studentId: studentId },
        { studentIdNumber: studentIdNumber ? studentIdNumber.trim() : undefined }
      ]
    });
    if (existingExam) {
      // Populate the existing exam before returning
      await existingExam.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
      await existingExam.populate('exams.subjectId', 'name');
      
      return res.status(400).json({
        success: false,
        message: 'Exam record already exists for this student',
        data: existingExam,
        exists: true
      });
    }

    // Create exam
    const examRecord = await Exam.create({
      studentId,
      studentIdNumber: studentIdNumber ? studentIdNumber.trim() : undefined,
      title: title ? title.trim() : undefined,
      firstName: firstName ? firstName.trim() : undefined,
      lastName: lastName ? lastName.trim() : undefined,
      otherNames: otherNames ? otherNames.trim() : undefined,
      familyName: familyName ? familyName.trim() : undefined,
      email: email ? email.trim() : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      birthDay: birthDay ? birthDay.trim() : undefined,
      birthMonth: birthMonth ? birthMonth.trim() : undefined,
      birthYear: birthYear ? birthYear.trim() : undefined,
      gender: gender ? gender.trim() : undefined,
      telephone: telephone ? telephone.trim() : undefined,
      mobile: mobile ? mobile.trim() : undefined,
      specialNeeds: specialNeeds ? specialNeeds.trim() : undefined,
      specialNeedsDetails: specialNeedsDetails ? specialNeedsDetails.trim() : undefined,
      guardianFirstName: guardianFirstName ? guardianFirstName.trim() : undefined,
      guardianLastName: guardianLastName ? guardianLastName.trim() : undefined,
      guardianTelephone: guardianTelephone ? guardianTelephone.trim() : undefined,
      guardianMobile: guardianMobile ? guardianMobile.trim() : undefined,
      ukVisa: ukVisa ? ukVisa.trim() : undefined,
      exams: processedExams,
      candidateIdNumber: candidateIdNumber ? candidateIdNumber.trim() : undefined,
      examDate: examDate ? new Date(examDate) : undefined
    });

    // Populate student data and exam subjects before sending response
    await examRecord.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
    await examRecord.populate('exams.subjectId', 'name');

    res.status(201).json({
      success: true,
      message: 'Exam record created successfully',
      data: examRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private
export const updateExam = async (req, res) => {
  try {
    const {
      title,
      firstName,
      lastName,
      otherNames,
      familyName,
      email,
      dateOfBirth,
      birthDay,
      birthMonth,
      birthYear,
      gender,
      telephone,
      mobile,
      specialNeeds,
      specialNeedsDetails,
      guardianFirstName,
      guardianLastName,
      guardianTelephone,
      guardianMobile,
      ukVisa,
      exams,
      candidateIdNumber,
      examDate
    } = req.body;

    let examRecord = await Exam.findById(req.params.id);

    if (!examRecord) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found'
      });
    }

    // Update fields
    if (title !== undefined) examRecord.title = title ? title.trim() : undefined;
    if (firstName !== undefined) {
      if (!firstName || !firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'First Name is required'
        });
      }
      examRecord.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (!lastName || !lastName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Last Name is required'
        });
      }
      examRecord.lastName = lastName.trim();
    }
    if (otherNames !== undefined) examRecord.otherNames = otherNames ? otherNames.trim() : undefined;
    if (familyName !== undefined) examRecord.familyName = familyName ? familyName.trim() : undefined;
    if (email !== undefined) examRecord.email = email ? email.trim() : undefined;
    if (dateOfBirth !== undefined) examRecord.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (birthDay !== undefined) examRecord.birthDay = birthDay ? birthDay.trim() : undefined;
    if (birthMonth !== undefined) examRecord.birthMonth = birthMonth ? birthMonth.trim() : undefined;
    if (birthYear !== undefined) examRecord.birthYear = birthYear ? birthYear.trim() : undefined;
    if (gender !== undefined) examRecord.gender = gender ? gender.trim() : undefined;
    if (telephone !== undefined) examRecord.telephone = telephone ? telephone.trim() : undefined;
    if (mobile !== undefined) examRecord.mobile = mobile ? mobile.trim() : undefined;
    if (specialNeeds !== undefined) examRecord.specialNeeds = specialNeeds ? specialNeeds.trim() : undefined;
    if (specialNeedsDetails !== undefined) examRecord.specialNeedsDetails = specialNeedsDetails ? specialNeedsDetails.trim() : undefined;
    if (guardianFirstName !== undefined) examRecord.guardianFirstName = guardianFirstName ? guardianFirstName.trim() : undefined;
    if (guardianLastName !== undefined) examRecord.guardianLastName = guardianLastName ? guardianLastName.trim() : undefined;
    if (guardianTelephone !== undefined) examRecord.guardianTelephone = guardianTelephone ? guardianTelephone.trim() : undefined;
    if (guardianMobile !== undefined) examRecord.guardianMobile = guardianMobile ? guardianMobile.trim() : undefined;
    if (ukVisa !== undefined) examRecord.ukVisa = ukVisa ? ukVisa.trim() : undefined;
    if (candidateIdNumber !== undefined) examRecord.candidateIdNumber = candidateIdNumber ? candidateIdNumber.trim() : undefined;
    if (examDate !== undefined) examRecord.examDate = examDate ? new Date(examDate) : null;
    
    // Update exams if provided
    if (exams !== undefined && Array.isArray(exams)) {
      if (exams.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one exam must be selected'
        });
      }

      // Validate and process exams
      const processedExams = [];
      for (const examItem of exams) {
        if (!examItem.subjectId) {
          return res.status(400).json({
            success: false,
            message: 'Each exam must have a subjectId'
          });
        }

        // Validate subject exists
        const subject = await Subject.findById(examItem.subjectId);
        if (!subject) {
          return res.status(404).json({
            success: false,
            message: `Subject with ID ${examItem.subjectId} not found`
          });
        }

        processedExams.push({
          subjectId: subject._id,
          subjectName: subject.name
        });
      }

      examRecord.exams = processedExams;
    }
    
    examRecord.updatedAt = Date.now();

    await examRecord.save();

    // Populate student data and exam subjects before sending response
    await examRecord.populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone');
    await examRecord.populate('exams.subjectId', 'name');

    res.status(200).json({
      success: true,
      message: 'Exam record updated successfully',
      data: examRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found'
      });
    }

    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Exam record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check if exam record exists for a student
// @route   GET /api/exams/student/:studentId
// @access  Public (both admin and client can check)
export const checkExamByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { studentIdNumber } = req.query;

    // Check by studentId (ObjectId) or studentIdNumber (string)
    let exam = null;
    
    if (studentId && studentId !== 'undefined') {
      exam = await Exam.findOne({ studentId })
        .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
        .populate('exams.subjectId', 'name');
    }
    
    // If not found by studentId, try studentIdNumber
    if (!exam && studentIdNumber) {
      exam = await Exam.findOne({ studentIdNumber: studentIdNumber.trim() })
        .populate('studentId', 'name studentId email birthday gender mobile hasSpecialNeeds specialNeed specialNeedsDetails guardianFirstName guardianLastName guardianTelephone')
        .populate('exams.subjectId', 'name');
    }

    if (exam) {
      return res.status(200).json({
        success: true,
        exists: true,
        data: exam
      });
    }

    res.status(200).json({
      success: true,
      exists: false,
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

