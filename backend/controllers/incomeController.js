import Expense from '../models/Expense.js';
import Employee from '../models/Employee.js';
import Student from '../models/Student.js';
import ExtraIncome from '../models/ExtraIncome.js';

// @desc    Get income statistics
// @route   GET /api/income/statistics
// @access  Private
export const getIncomeStatistics = async (req, res) => {
  try {
    // Calculate total expenses
    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.price || 0), 0);

    // Calculate total salary (sum of all employees' basic salary + commission)
    const employees = await Employee.find();
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.basicSalary || 0) + (emp.commission || 0), 0);

    // Calculate total student payments (sum of all students' totalPrice)
    const students = await Student.find();
    const totalStudentPayments = students.reduce((sum, student) => sum + (student.totalPrice || 0), 0);

    // Calculate total extra income
    const extraIncomes = await ExtraIncome.find();
    const totalExtraIncome = extraIncomes.reduce((sum, extra) => sum + (extra.amount || 0), 0);

    // Calculate total revenue (student payments + extra income)
    const totalRevenue = totalStudentPayments + totalExtraIncome;

    // Calculate net income (total revenue - expenses - salary)
    const netIncome = totalRevenue - totalExpenses - totalSalary;

    // Get detailed breakdown
    const expenseBreakdown = expenses.reduce((acc, expense) => {
      const type = expense.type || 'Other';
      acc[type] = (acc[type] || 0) + (expense.price || 0);
      return acc;
    }, {});

    const expenseDetails = Object.entries(expenseBreakdown).map(([type, amount]) => ({
      type,
      amount
    }));

    // Get extra income breakdown
    const extraIncomeDetails = extraIncomes.map(extra => ({
      title: extra.title,
      amount: extra.amount,
      year: extra.year,
      month: extra.month
    }));

    res.status(200).json({
      success: true,
      data: {
        totalExpenses,
        totalSalary,
        totalStudentPayments,
        totalExtraIncome,
        totalRevenue,
        netIncome,
        expenseDetails,
        extraIncomeDetails,
        expenseCount: expenses.length,
        salaryCount: employees.length,
        studentCount: students.length,
        extraIncomeCount: extraIncomes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

