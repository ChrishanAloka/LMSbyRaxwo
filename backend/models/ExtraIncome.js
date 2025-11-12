import mongoose from 'mongoose';

const extraIncomeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    trim: true
  },
  month: {
    type: String,
    required: [true, 'Month is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ExtraIncome = mongoose.model('ExtraIncome', extraIncomeSchema);

export default ExtraIncome;

