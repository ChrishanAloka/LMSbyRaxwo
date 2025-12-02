import Expense from '../models/Expense.js';
import Employee from '../models/Employee.js';
import Student from '../models/Student.js';
import ExtraIncome from '../models/ExtraIncome.js';
import Payment from '../models/Payment.js';

// @desc    Get income statistics
// @route   GET /api/income/statistics
// @access  Private
export const getIncomeStatistics = async (req, res) => {
  try {
    // Get month filter from query parameters
    const { months, year } = req.query;
    let monthFilter = {};
    let yearFilter = {};

    // Parse months filter (can be single month or comma-separated months)
    if (months) {
      const monthArray = Array.isArray(months) ? months : months.split(',');
      monthFilter = { month: { $in: monthArray.map(m => m.trim()) } };
    }

    // Parse year filter
    if (year) {
      yearFilter = { year: String(year) };
    }

    // Calculate total expenses (filtered by month/year if provided)
    const expenseQuery = { ...monthFilter, ...yearFilter };
    const expenses = await Expense.find(expenseQuery);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.price || 0), 0);

    // Calculate total salary (sum of all employees' basic salary + commission)
    // Note: Salary is not month-specific, so we include it in all cases
    const employees = await Employee.find();
    const totalSalary = employees.reduce((sum, emp) => sum + (emp.basicSalary || 0) + (emp.commission || 0), 0);

    // Calculate total student payments (filtered by month if provided)
    // Note: Student payments are linked to payment records which have months
    let totalStudentPayments = 0;
    let students = [];
    if (months) {
      const monthArray = Array.isArray(months) ? months : months.split(',');
      const payments = await Payment.find({ month: { $in: monthArray.map(m => m.trim()) } });
      totalStudentPayments = payments.reduce((sum, payment) => sum + (payment.totalAmount || 0), 0);
    } else {
      // If no month filter, use all student totalPrice (for backward compatibility)
      students = await Student.find();
      totalStudentPayments = students.reduce((sum, student) => sum + (student.totalPrice || 0), 0);
    }

    // Calculate total extra income (filtered by month/year if provided)
    const extraIncomeQuery = { ...monthFilter, ...yearFilter };
    const extraIncomes = await ExtraIncome.find(extraIncomeQuery);
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

