import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  studentEmail: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'left'],
    default: 'active'
  },
  attendance: {
    type: String,
    enum: ['pending', 'attended', 'absent'],
    default: 'pending'
  },
  leftAt: {
    type: Date
  },
  attendanceMarkedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
attemptSchema.index({ classId: 1, studentId: 1 });
attemptSchema.index({ classId: 1, status: 1 });
attemptSchema.index({ studentId: 1, status: 1 });

const Attempt = mongoose.model('Attempt', attemptSchema);

export default Attempt;

