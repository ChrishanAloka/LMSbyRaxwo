import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Teacher ID is required']
  },
  date: {
    type: String,
    required: [true, 'Class date is required']
  },
  time: {
    type: String,
    required: [true, 'Class time is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  breakStatus: {
    type: String,
    enum: ['none', 'on_break', 'class_starting'],
    default: 'none'
  },
  breakStartTime: {
    type: Date
  },
  breaks: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number // Duration in milliseconds
    }
  }],
  totalBreakDuration: {
    type: Number, // Total break duration in milliseconds
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Class = mongoose.model('Class', classSchema);

export default Class;
