import Expense from '../models/Expense.js';

export const listExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { year, month, type, price } = req.body;
    if (!year || !month || !type || price === undefined) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const doc = await Expense.create({ year: String(year), month, type, price: Number(price), createdBy: req.user?._id });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month, type, price } = req.body;
    const doc = await Expense.findByIdAndUpdate(
      id,
      { year: String(year), month, type, price: Number(price) },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Expense.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


