import Marks from '../models/Marks.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Employee from '../models/Employee.js';

// @desc    Get all marks records
// @route   GET /api/marks
// @access  Private
export const getMarks = async (req, res) => {
  try {
    const marksRecords = await Marks.find()
      .populate('studentId', 'name studentId email')
      .populate('subjects.subjectId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: marksRecords.length,
      data: marksRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get marks by student ID
// @route   GET /api/marks/student/:studentId
// @access  Private
export const getMarksByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find student by studentId field (not _id)
    const student = await Student.findOne({ studentId: studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found with this Student ID'
      });
    }

    const marksRecord = await Marks.findOne({ studentId: student._id })
      .populate('studentId', 'name studentId email')
      .populate('subjects.subjectId', 'name');

    if (!marksRecord) {
      return res.status(404).json({
        success: false,
        message: 'No marks found for this student'
      });
    }

    res.status(200).json({
      success: true,
      data: marksRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Validate student ID
// @route   GET /api/marks/validate-student/:studentId
// @access  Private
export const validateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({ studentId: studentId })
      .populate('subjects', 'name _id');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Student ID. Student not found.',
        valid: false
      });
    }

    // Populate subjects if they're ObjectIds
    let populatedSubjects = student.subjects;
    if (student.subjects && student.subjects.length > 0 && typeof student.subjects[0] === 'object' && student.subjects[0]._id) {
      // Already populated
      populatedSubjects = student.subjects;
    } else if (student.subjects && student.subjects.length > 0) {
      // Need to populate
      await student.populate('subjects', 'name _id');
      populatedSubjects = student.subjects;
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        studentId: student._id,
        name: student.name,
        studentIdField: student.studentId,
        subjects: populatedSubjects
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create marks record
// @route   POST /api/marks
// @access  Private
export const createMarks = async (req, res) => {
  try {
    const { studentId, subjects } = req.body;

    if (!studentId || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student ID and at least one subject with marks and grade'
      });
    }

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if marks already exist for this student
    const existingMarks = await Marks.findOne({ studentId });
    if (existingMarks) {
      return res.status(400).json({
        success: false,
        message: 'Marks already exist for this student. Please update instead.'
      });
    }

    // Validate and process subjects
    const processedSubjects = [];
    for (const subject of subjects) {
      if (!subject.subjectId || subject.marks === undefined || !subject.grade) {
        return res.status(400).json({
          success: false,
          message: 'Each subject must have subjectId, marks, and grade'
        });
      }

      if (subject.marks < 0 || subject.marks > 100) {
        return res.status(400).json({
          success: false,
          message: 'Marks must be between 0 and 100'
        });
      }

      let subjectId = subject.subjectId;
      
      // Check if subjectId is a valid ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(subjectId);
      
      if (!isValidObjectId) {
        // If not a valid ObjectId, treat it as a subject name
        // Try to find existing subject by name
        let subjectDoc = await Subject.findOne({ name: subjectId });
        
        if (!subjectDoc) {
          // Create a temporary test subject if it doesn't exist
          // Note: This is a temporary solution for test subjects
          // Find any employee to use as conductedBy (required field)
          const anyEmployee = await Employee.findOne();
          
          if (!anyEmployee) {
            return res.status(400).json({
              success: false,
              message: 'Cannot create test subjects. No employees found in the system. Please create a subject first.'
            });
          }

          subjectDoc = await Subject.create({
            name: subjectId,
            description: `Temporary test subject: ${subjectId}`,
            image: '/uploads/default-subject.png',
            conductedBy: anyEmployee._id,
            status: 'active'
          });
        }
        
        subjectId = subjectDoc._id;
      } else {
        // Validate subject exists
        const subjectExists = await Subject.findById(subjectId);
        if (!subjectExists) {
          return res.status(404).json({
            success: false,
            message: `Subject with ID ${subjectId} not found`
          });
        }
      }

      processedSubjects.push({
        subjectId: subjectId,
        marks: subject.marks,
        grade: subject.grade
      });
    }

    // Create marks record
    const marksRecord = await Marks.create({
      studentId,
      subjects: processedSubjects
    });

    // Populate before sending response
    await marksRecord.populate('studentId', 'name studentId email');
    await marksRecord.populate('subjects.subjectId', 'name');

    res.status(201).json({
      success: true,
      message: 'Marks created successfully',
      data: marksRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update marks record
// @route   PUT /api/marks/:id
// @access  Private
export const updateMarks = async (req, res) => {
  try {
    const { subjects } = req.body;

    let marksRecord = await Marks.findById(req.params.id);

    if (!marksRecord) {
      return res.status(404).json({
        success: false,
        message: 'Marks record not found'
      });
    }

    if (subjects && Array.isArray(subjects)) {
      // Validate and process subjects
      const processedSubjects = [];
      for (const subject of subjects) {
        if (!subject.subjectId || subject.marks === undefined || !subject.grade) {
          return res.status(400).json({
            success: false,
            message: 'Each subject must have subjectId, marks, and grade'
          });
        }

        if (subject.marks < 0 || subject.marks > 100) {
          return res.status(400).json({
            success: false,
            message: 'Marks must be between 0 and 100'
          });
        }

        let subjectId = subject.subjectId;
        
        // Check if subjectId is a valid ObjectId
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(subjectId);
        
        if (!isValidObjectId) {
          // If not a valid ObjectId, treat it as a subject name
          // Try to find existing subject by name
          let subjectDoc = await Subject.findOne({ name: subjectId });
          
          if (!subjectDoc) {
            // Create a temporary test subject if it doesn't exist
            // Find any employee to use as conductedBy (required field)
            const anyEmployee = await Employee.findOne();
            
            if (!anyEmployee) {
              return res.status(400).json({
                success: false,
                message: 'Cannot create test subjects. No employees found in the system. Please create a subject first.'
              });
            }

            subjectDoc = await Subject.create({
              name: subjectId,
              description: `Temporary test subject: ${subjectId}`,
              image: '/uploads/default-subject.png',
              conductedBy: anyEmployee._id,
              status: 'active'
            });
          }
          
          subjectId = subjectDoc._id;
        } else {
          // Validate subject exists
          const subjectExists = await Subject.findById(subjectId);
          if (!subjectExists) {
            return res.status(404).json({
              success: false,
              message: `Subject with ID ${subjectId} not found`
            });
          }
        }

        processedSubjects.push({
          subjectId: subjectId,
          marks: subject.marks,
          grade: subject.grade
        });
      }

      marksRecord.subjects = processedSubjects;
    }

    await marksRecord.save();

    // Populate before sending response
    await marksRecord.populate('studentId', 'name studentId email');
    await marksRecord.populate('subjects.subjectId', 'name');

    res.status(200).json({
      success: true,
      message: 'Marks updated successfully',
      data: marksRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete marks record
// @route   DELETE /api/marks/:id
// @access  Private
export const deleteMarks = async (req, res) => {
  try {
    const marksRecord = await Marks.findById(req.params.id);

    if (!marksRecord) {
      return res.status(404).json({
        success: false,
        message: 'Marks record not found'
      });
    }

    await marksRecord.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Marks deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

