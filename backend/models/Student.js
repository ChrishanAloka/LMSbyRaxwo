import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  birthday: {
    type: Date,
    required: [true, 'Birthday is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  hasSpecialNeeds: {
    type: Boolean,
    default: false
  },
  specialNeedsDetails: {
    type: String,
    trim: true
  },
  guardianName: {
    type: String,
    trim: true
  },
  guardianTelephone: {
    type: String,
    trim: true
  },
  paymentType: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: ['cash', 'card']
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Student = mongoose.model('Student', studentSchema);

export default Student;

