import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  studentIdNumber: {
    type: String,
    required: [true, 'Student ID Number is required'],
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First Name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last Name is required'],
    trim: true
  },
  otherNames: {
    type: String,
    trim: true
  },
  familyName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  birthDay: {
    type: String,
    trim: true
  },
  birthMonth: {
    type: String,
    trim: true
  },
  birthYear: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true
  },
  telephone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  specialNeeds: {
    type: String,
    trim: true
  },
  specialNeedsDetails: {
    type: String,
    trim: true
  },
  guardianFirstName: {
    type: String,
    trim: true
  },
  guardianLastName: {
    type: String,
    trim: true
  },
  guardianTelephone: {
    type: String,
    trim: true
  },
  guardianMobile: {
    type: String,
    trim: true
  },
  ukVisa: {
    type: String,
    required: false,
    trim: true
  },
  exams: {
    type: [{
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
      },
      subjectName: {
        type: String,
        required: true
      }
    }],
    required: [true, 'At least one exam is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one exam must be selected'
    }
  },
  candidateIdNumber: {
    type: String,
    required: false,
    trim: true
  },
  examDate: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
examSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Exam = mongoose.model('Exam', examSchema);

export default Exam;

