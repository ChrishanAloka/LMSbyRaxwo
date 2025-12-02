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
      firstName,
      lastName,
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
    const existingExam = await Exam.findOne({ studentId });
    if (existingExam) {
      return res.status(400).json({
        success: false,
        message: 'Exam record already exists for this student'
      });
    }

    // Create exam
    const examRecord = await Exam.create({
      studentId,
      studentIdNumber: studentIdNumber.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
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
      firstName,
      lastName,
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
    if (ukVisa !== undefined) {
      examRecord.ukVisa = ukVisa ? ukVisa.trim() : undefined;
    }
    if (candidateIdNumber !== undefined) {
      examRecord.candidateIdNumber = candidateIdNumber ? candidateIdNumber.trim() : undefined;
    }
    if (examDate !== undefined) {
      examRecord.examDate = examDate ? new Date(examDate) : null;
    }
    
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

