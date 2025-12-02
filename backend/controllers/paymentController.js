import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import { sendPaymentSMS } from '../services/smsService.js';

// @desc    Create a new payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res) => {
  try {
    const { studentId, studentIdNumber, subjects, totalAmount, month, paymentMethod, paymentDate } = req.body;

    // Validation
    if (!studentId || !studentIdNumber || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and at least one subject are required'
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total amount must be greater than 0'
      });
    }

    if (!month || !paymentMethod || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Month, payment method, and payment date are required'
      });
    }

    // Verify student exists and get mobile number
    const student = await Student.findById(studentId).select('name email studentId mobile');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify all subjects exist
    const subjectsExist = await Subject.find({ _id: { $in: subjects } });
    if (subjectsExist.length !== subjects.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more subjects not found'
      });
    }

    // Create payment
    const payment = await Payment.create({
      studentId,
      studentIdNumber,
      subjects,
      totalAmount,
      month,
      paymentMethod,
      paymentDate,
      createdBy: req.user?._id || null
    });

    // Populate the payment with student and subject details
    const populatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'name email studentId mobile')
      .populate('subjects', 'name price');

    // Send SMS notification
    try {
      console.log('Sending payment SMS to student:', student.name, 'Mobile:', student.mobile);
      const smsResult = await sendPaymentSMS(student, populatedPayment);
      console.log('Payment SMS result:', smsResult);
    } catch (smsError) {
      // Log SMS error but don't fail the request
      console.error('Failed to send SMS notification:', smsError);
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record payment'
    });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res) => {
  try {
    // Get month filter from query parameters
    const { month } = req.query;
    let query = {};

    // Parse month filter
    if (month) {
      query.month = month.trim();
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payments'
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment'
    });
  }
};

// @desc    Get payments by student ID
// @route   GET /api/payments/student/:studentId
// @access  Private
export const getPaymentsByStudent = async (req, res) => {
  try {
    const payments = await Payment.find({ studentId: req.params.studentId })
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student payments'
    });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req, res) => {
  try {
    const { subjects, totalAmount, month, paymentMethod, paymentDate } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update fields if provided
    if (subjects) payment.subjects = subjects;
    if (totalAmount !== undefined) payment.totalAmount = totalAmount;
    if (month) payment.month = month;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (paymentDate) payment.paymentDate = paymentDate;

    await payment.save();

    const updatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'name email studentId')
      .populate('subjects', 'name price');

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment'
    });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete payment'
    });
  }
};

