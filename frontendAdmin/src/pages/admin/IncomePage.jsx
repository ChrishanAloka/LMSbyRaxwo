import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import revenueIcon from '../../assets/revenue.png';
import expensesIcon from '../../assets/expenses (2).png';
import employeeSalaryIcon from '../../assets/employeeSalary.png';
import netIncomeIcon from '../../assets/netincome.png';
import './IncomePage.css';

const IncomePage = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const token = localStorage.getItem('adminToken');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchIncomeStatistics();
  }, [selectedMonths]);

  const handleMonthToggle = (month) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedMonths([]);
  };

  const fetchIncomeStatistics = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedMonths.length > 0) {
        params.append('months', selectedMonths.join(','));
      }

      const url = `https://lms-f679.onrender.com/api/income/statistics${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch income statistics');
      }
    } catch (err) {
      console.error('Error fetching income statistics:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const summaryRows = React.useMemo(() => {
    if (!statistics) {
      return [];
    }

    return [
      {
        label: 'Total Student Payments',
        amount: statistics.totalStudentPayments || 0
      },
      {
        label: 'Total Extra Income',
        amount: statistics.totalExtraIncome || 0
      },
      {
        label: 'Total Expenses',
        amount: statistics.totalExpenses || 0
      },
      {
        label: 'Total Employee Salary',
        amount: statistics.totalSalary || 0
      },
      {
        label: 'Total Revenue',
        amount: statistics.totalRevenue || 0
      }
    ];
  }, [statistics]);

  const filteredSummaryRows = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return summaryRows;
    }
    return summaryRows.filter((row) =>
      [row.label, row.amount?.toString()]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [summaryRows, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredSummaryRows.length) {
      alert('No finance summary records available to generate a report.');
      return;
    }

    const headers = ['Metric', 'Amount (LKR)'];
    const rows = filteredSummaryRows.map((row) => [
      row.label,
      row.amount ?? 0
    ]);

    const csvContent = [
      `Finance Report - ${new Date().toISOString().slice(0, 10)}`,
      ...headers,
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateFilteredReport = () => {
    if (selectedMonths.length === 0) {
      alert('Please select at least one month to generate a filtered report.');
      return;
    }

    if (!filteredSummaryRows.length) {
      alert('No finance summary records available to generate a report.');
      return;
    }

    // Build filter info for report
    const filterText = `\nFiltered by: Months: ${selectedMonths.join(', ')}\n`;

    const headers = ['Metric', 'Amount (LKR)'];
    const rows = filteredSummaryRows.map((row) => [
      row.label,
      row.amount ?? 0
    ]);

    const csvContent = [
      `Finance Report - Filtered by Month(s) - ${new Date().toISOString().slice(0, 10)}${filterText}`,
      ...headers,
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `finance-report-filtered-${selectedMonths.join('-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="income-page">
        <Sidebar />
        <div className="income-main-content">
          <Topbar userName="Admin" />
          <div className="income-content">
            <div className="loading-state">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className="income-page">
        <Sidebar />
        <div className="income-main-content">
          <Topbar userName="Admin" />
          <div className="income-content">
            <div className="error-state">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="income-page">
      <Sidebar />
      <div className="income-main-content">
        <Topbar userName="Admin" />
        
        <div className="income-content">
          <div className="income-header">
            <h1>Income Overview</h1>
            <div className="income-header-actions">
              <div className="income-search">
                <input
                  type="text"
                  placeholder="Search finance summary"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                type="button"
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Filter'}
              </button>
              <button
                type="button"
                className="report-btn"
                onClick={handleGenerateReport}
                disabled={filteredSummaryRows.length === 0}
              >
                Generate Report
              </button>
              {selectedMonths.length > 0 && (
                <button
                  type="button"
                  className="filtered-report-btn"
                  onClick={handleGenerateFilteredReport}
                  disabled={filteredSummaryRows.length === 0}
                >
                  Generate Filtered Report
                </button>
              )}
            </div>
          </div>

          {/* Month Filter Section */}
          {showFilters && (
            <div className="filter-section">
            <div className="filter-header-row">
              {selectedMonths.length > 0 && (
                <button
                  type="button"
                  className="clear-filter-btn"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="filter-group">
              <label>Select Month(s)</label>
              <div className="months-filter">
                <div className="months-checkbox-grid">
                  {months.map((month, index) => (
                    <label key={index} className="month-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(month)}
                        onChange={() => handleMonthToggle(month)}
                      />
                      <span>{month}</span>
                    </label>
                  ))}
                </div>
                {selectedMonths.length > 0 && (
                  <div className="selected-months-info">
                    <span>{selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''} selected: {selectedMonths.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {statistics && (
            <>
              {/* Summary Cards */}
              <div className="income-cards">
                <div className="income-card revenue">
                  <div className="card-icon">
                    <img src={revenueIcon} alt="Revenue" />
                  </div>
                  <div className="card-content">
                    <h3>Total Revenue</h3>
                    <p className="card-value positive">LKR {formatCurrency(statistics.totalRevenue || statistics.totalStudentPayments)}</p>
                    <p className="card-label">Student Payments + Extra Income</p>
                  </div>
                </div>

                <div className="income-card expense">
                  <div className="card-icon">
                    <img src={expensesIcon} alt="Expenses" />
                  </div>
                  <div className="card-content">
                    <h3>Total Expenses</h3>
                    <p className="card-value negative">LKR {formatCurrency(statistics.totalExpenses)}</p>
                    <p className="card-label">{statistics.expenseCount} expense{statistics.expenseCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="income-card salary">
                  <div className="card-icon">
                    <img src={employeeSalaryIcon} alt="Employee Salary" />
                  </div>
                  <div className="card-content">
                    <h3>Total Employee Salary</h3>
                    <p className="card-value negative">LKR {formatCurrency(statistics.totalSalary)}</p>
                    <p className="card-label">{statistics.salaryCount} employee{statistics.salaryCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="income-card net">
                  <div className="card-icon">
                    <img src={netIncomeIcon} alt="Net Income" />
                  </div>
                  <div className="card-content">
                    <h3>Net Income</h3>
                    <p className={`card-value ${statistics.netIncome >= 0 ? 'positive' : 'negative'}`}>
                      LKR {formatCurrency(statistics.netIncome)}
                    </p>
                    <p className="card-label">Revenue - Expenses - Salary</p>
                  </div>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="income-breakdown">
                <h2>Income Calculation</h2>
                <div className="breakdown-card">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Total Student Payments:</span>
                    <span className="breakdown-value positive">+ LKR {formatCurrency(statistics.totalStudentPayments)}</span>
                  </div>
                  {statistics.totalExtraIncome > 0 && (
                    <div className="breakdown-row">
                      <span className="breakdown-label">Total Extra Income:</span>
                      <span className="breakdown-value positive">+ LKR {formatCurrency(statistics.totalExtraIncome || 0)}</span>
                    </div>
                  )}
                  <div className="breakdown-row">
                    <span className="breakdown-label">Total Expenses:</span>
                    <span className="breakdown-value negative">- LKR {formatCurrency(statistics.totalExpenses)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-label">Total Employee Salary:</span>
                    <span className="breakdown-value negative">- LKR {formatCurrency(statistics.totalSalary)}</span>
                  </div>
                  <div className="breakdown-divider"></div>
                  <div className="breakdown-row total">
                    <span className="breakdown-label">Net Income:</span>
                    <span className={`breakdown-value ${statistics.netIncome >= 0 ? 'positive' : 'negative'}`}>
                      LKR {formatCurrency(statistics.netIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extra Income Breakdown */}
              {statistics.extraIncomeDetails && statistics.extraIncomeDetails.length > 0 && (
                <div className="expense-breakdown extra-income-breakdown">
                  <h2>Extra Income Breakdown</h2>
                  <div className="expense-list">
                    {statistics.extraIncomeDetails.map((extra, index) => (
                      <div key={index} className="expense-item extra-income-item">
                        <div>
                          <span className="expense-type">{extra.title}</span>
                          <span className="expense-date">{extra.month} {extra.year}</span>
                        </div>
                        <span className="expense-amount extra-income-amount">LKR {formatCurrency(extra.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense Breakdown by Type */}
              {statistics.expenseDetails && statistics.expenseDetails.length > 0 && (
                <div className="expense-breakdown">
                  <h2>Expense Breakdown by Type</h2>
                  <div className="expense-list">
                    {statistics.expenseDetails.map((expense, index) => (
                      <div key={index} className="expense-item">
                        <span className="expense-type">{expense.type}</span>
                        <span className="expense-amount">LKR {formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Finance Summary Table */}
              <div className="finance-summary">
                <h2>Finance Summary Details</h2>
                {filteredSummaryRows.length === 0 ? (
                  <div className="empty-state compact">
                    <p>No summary entries match your search.</p>
                  </div>
                ) : (
                  <div className="finance-summary-table-wrapper">
                    <table className="finance-summary-table">
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Amount (LKR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSummaryRows.map((row) => (
                          <tr key={row.label}>
                            <td>{row.label}</td>
                            <td>LKR {formatCurrency(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomePage;

