import ExtraIncome from '../models/ExtraIncome.js';

// @desc    Get all extra income records
// @route   GET /api/extra-income
// @access  Private
export const getExtraIncomes = async (req, res) => {
  try {
    // Get month filter from query parameters
    const { months } = req.query;
    let query = {};

    // Parse months filter (can be single month or comma-separated months)
    if (months) {
      const monthArray = Array.isArray(months) ? months : months.split(',');
      query.month = { $in: monthArray.map(m => m.trim()) };
    }

    const extraIncomes = await ExtraIncome.find(query)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: extraIncomes.length,
      data: extraIncomes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single extra income record
// @route   GET /api/extra-income/:id
// @access  Private
export const getExtraIncome = async (req, res) => {
  try {
    const extraIncome = await ExtraIncome.findById(req.params.id);
    
    if (!extraIncome) {
      return res.status(404).json({
        success: false,
        message: 'Extra income record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: extraIncome
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create extra income record
// @route   POST /api/extra-income
// @access  Private
export const createExtraIncome = async (req, res) => {
  try {
    const { title, description, amount, year, month } = req.body;

    // Validate required fields
    if (!title || !amount || !year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, amount, year, month)'
      });
    }

    // Create extra income record
    const extraIncome = await ExtraIncome.create({
      title,
      description: description || '',
      amount,
      year: String(year),
      month
    });

    res.status(201).json({
      success: true,
      message: 'Extra income record created successfully',
      data: extraIncome
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update extra income record
// @route   PUT /api/extra-income/:id
// @access  Private
export const updateExtraIncome = async (req, res) => {
  try {
    const { title, description, amount, year, month } = req.body;

    let extraIncome = await ExtraIncome.findById(req.params.id);

    if (!extraIncome) {
      return res.status(404).json({
        success: false,
        message: 'Extra income record not found'
      });
    }

    // Update fields
    if (title) extraIncome.title = title;
    if (description !== undefined) extraIncome.description = description;
    if (amount !== undefined) extraIncome.amount = amount;
    if (year) extraIncome.year = String(year);
    if (month) extraIncome.month = month;

    await extraIncome.save();

    res.status(200).json({
      success: true,
      message: 'Extra income record updated successfully',
      data: extraIncome
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete extra income record
// @route   DELETE /api/extra-income/:id
// @access  Private
export const deleteExtraIncome = async (req, res) => {
  try {
    const extraIncome = await ExtraIncome.findById(req.params.id);

    if (!extraIncome) {
      return res.status(404).json({
        success: false,
        message: 'Extra income record not found'
      });
    }

    await extraIncome.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Extra income record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

