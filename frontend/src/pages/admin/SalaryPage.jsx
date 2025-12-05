import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import './SalaryPage.css';

const SalaryPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [commissionData, setCommissionData] = useState({
    employeeId: '',
    amount: '',
    month: ''
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const [commissionError, setCommissionError] = useState('');
  const [submittingCommission, setSubmittingCommission] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCommission, setEditingCommission] = useState(null);
  const [showEditCommissionModal, setShowEditCommissionModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setLoading(false);
    }
  };

  // Filter teachers - employees with role containing "teacher" (case-insensitive)
  const teachers = employees.filter(emp => 
    emp.role && emp.role.toLowerCase().includes('teacher')
  );

  // Calculate total salary (basic salary + commission)
  const totalSalary = employees.reduce((sum, emp) => 
    sum + (emp.basicSalary || 0) + (emp.commission || 0), 0
  );

  const handleCommissionChange = (e) => {
    setCommissionData({
      ...commissionData,
      [e.target.name]: e.target.value
    });
    setCommissionError('');
  };

  const handleAddCommission = async (e) => {
    e.preventDefault();
    setCommissionError('');
    
    if (!commissionData.employeeId || !commissionData.amount || !commissionData.month) {
      setCommissionError('Please select a teacher, enter an amount, and choose a month');
      return;
    }

    const amount = parseFloat(commissionData.amount);
    if (isNaN(amount) || amount < 0) {
      setCommissionError('Please enter a valid amount');
      return;
    }

    setSubmittingCommission(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/admin/employees/${commissionData.employeeId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          commission: amount,
          month: commissionData.month
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchEmployees();
        setCommissionData({ employeeId: '', amount: '', month: '' });
        setShowCommissionForm(false);
      } else {
        setCommissionError(data.message || 'Failed to add commission');
      }
    } catch (err) {
      setCommissionError('Network error. Please try again.');
    } finally {
      setSubmittingCommission(false);
    }
  };

  const handleEditCommission = (employee) => {
    setEditingCommission({
      employeeId: employee._id,
      employeeName: employee.name,
      monthlyCommissions: employee.monthlyCommissions || [],
      selectedMonth: '',
      amount: ''
    });
    setShowEditCommissionModal(true);
    setCommissionError('');
  };

  const handleEditCommissionChange = (e) => {
    setEditingCommission({
      ...editingCommission,
      [e.target.name]: e.target.value
    });
    setCommissionError('');
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    setCommissionError('');

    if (!editingCommission.selectedMonth || !editingCommission.amount) {
      setCommissionError('Please select a month and enter an amount');
      return;
    }

    const amount = parseFloat(editingCommission.amount);
    if (isNaN(amount) || amount < 0) {
      setCommissionError('Please enter a valid amount');
      return;
    }

    setSubmittingCommission(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/admin/employees/${editingCommission.employeeId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          commission: amount,
          month: editingCommission.selectedMonth
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchEmployees();
        setShowEditCommissionModal(false);
        setEditingCommission(null);
      } else {
        setCommissionError(data.message || 'Failed to update commission');
      }
    } catch (err) {
      setCommissionError('Network error. Please try again.');
    } finally {
      setSubmittingCommission(false);
    }
  };

  const handleDeleteMonthlyCommission = async (employeeId, month) => {
    if (!window.confirm(`Are you sure you want to delete the commission for ${month}?`)) {
      return;
    }

    try {
      // Get the employee
      const employee = employees.find(emp => emp._id === employeeId);
      if (!employee || !employee.monthlyCommissions) {
        return;
      }

      // Remove the commission for the selected month
      const updatedCommissions = employee.monthlyCommissions.filter(mc => mc.month !== month);
      
      // Calculate new total
      const newTotal = updatedCommissions.reduce((sum, mc) => sum + (mc.amount || 0), 0);

      // Update employee with new commissions
      const response = await fetch(`${API_CONFIG.API_URL}/admin/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          commission: newTotal,
          monthlyCommissions: updatedCommissions
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchEmployees();
        if (editingCommission && editingCommission.employeeId === employeeId) {
          setEditingCommission({
            ...editingCommission,
            monthlyCommissions: updatedCommissions
          });
        }
      } else {
        alert(data.message || 'Failed to delete commission');
      }
    } catch (err) {
      console.error('Error deleting commission:', err);
      alert('Network error. Please try again.');
    }
  };

  const filteredEmployees = React.useMemo(() => {
    let filtered = employees;
    
    // Apply search term filter
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((employee) =>
        [
          employee.name,
          employee.role,
          employee.email,
          employee.basicSalary?.toString(),
          employee.commission?.toString()
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term))
      );
    }

    // Apply month filter
    if (selectedMonths.length > 0) {
      filtered = filtered.map(employee => {
        const monthlyCommissions = employee.monthlyCommissions || [];
        const filteredCommissions = monthlyCommissions.filter(mc => 
          selectedMonths.includes(mc.month)
        );
        
        // Calculate filtered commission total
        const filteredCommissionTotal = filteredCommissions.reduce(
          (sum, mc) => sum + (mc.amount || 0), 0
        );

        return {
          ...employee,
          filteredMonthlyCommissions: filteredCommissions,
          filteredCommission: filteredCommissionTotal
        };
      }).filter(employee => 
        // Only show employees who have commissions in the selected months
        employee.filteredMonthlyCommissions.length > 0
      );
    }

    return filtered;
  }, [employees, searchTerm, selectedMonths]);

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

  const handleGenerateReport = () => {
    if (!filteredEmployees.length) {
      alert('No salary records available to generate a report.');
      return;
    }

    const headers = [
      'Employee Name',
      'Role',
      'Basic Salary (LKR)',
      'Commission (LKR)',
      'Total Salary (LKR)'
    ];

    const rows = filteredEmployees.map((employee) => {
      const commission = selectedMonths.length > 0 
        ? (employee.filteredCommission || 0)
        : (employee.commission || 0);
      const total = (employee.basicSalary || 0) + commission;
      return [
        employee.name || '',
        employee.role || '',
        employee.basicSalary ?? 0,
        commission,
        total
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary-report-${new Date().toISOString().slice(0, 10)}.csv`;
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

    if (!filteredEmployees.length) {
      alert('No salary records available to generate a report.');
      return;
    }

    // Build filter info for report
    const filterText = `\nFiltered by: Months: ${selectedMonths.join(', ')}\n`;

    const headers = [
      'Employee Name',
      'Role',
      'Basic Salary (LKR)',
      'Commission Months',
      'Commission Amount (LKR)',
      'Total Salary (LKR)'
    ];

    const rows = filteredEmployees.map((employee) => {
      const filteredCommissions = employee.filteredMonthlyCommissions || [];
      const commissionMonths = filteredCommissions.map(mc => mc.month).join(', ');
      const commissionAmount = employee.filteredCommission || 0;
      const total = (employee.basicSalary || 0) + commissionAmount;
      
      return [
        employee.name || '',
        employee.role || '',
        employee.basicSalary ?? 0,
        commissionMonths || 'None',
        commissionAmount,
        total
      ];
    });

    const csvContent = [
      `Salary Report - Filtered by Month(s) - ${new Date().toISOString().slice(0, 10)}${filterText}`,
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
    const fileName = `salary-report-filtered-${selectedMonths.join('-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="salary-page">
      <Sidebar />
      <div className="salary-main-content">
        <Topbar userName="Admin" />
        
        <div className="salary-content">
          <div className="salary-header">
            <div>
              <h1>Salary Management</h1>
              <p className="salary-subtitle">View and manage employee salaries</p>
            </div>
            <div className="salary-header-actions">
              <div className="salary-search">
                <input
                  type="text"
                  placeholder="Search by employee name or role"
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
                disabled={filteredEmployees.length === 0}
              >
                Generate Report
              </button>
              {selectedMonths.length > 0 && (
                <button
                  type="button"
                  className="filtered-report-btn"
                  onClick={handleGenerateFilteredReport}
                  disabled={filteredEmployees.length === 0}
                >
                  Generate Filtered Report
                </button>
              )}
              <button 
                className="add-commission-btn" 
                onClick={() => setShowCommissionForm(!showCommissionForm)}
              >
                {showCommissionForm ? 'Cancel' : '+ Add Commission'}
              </button>
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

          {showCommissionForm && (
            <div className="commission-form-container">
              <h2>Add Commission</h2>
              <form onSubmit={handleAddCommission} className="commission-form">
                {commissionError && <div className="error-message">{commissionError}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employeeId">Select Teacher <span className="required">*</span></label>
                    <select
                      id="employeeId"
                      name="employeeId"
                      value={commissionData.employeeId}
                      onChange={handleCommissionChange}
                      required
                    >
                      <option value="">Select a teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name} ({teacher.role})
                        </option>
                      ))}
                    </select>
                    {teachers.length === 0 && (
                      <p className="form-hint">No teachers found. Teachers are employees with role containing "teacher".</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="amount">Commission Amount (LKR) <span className="required">*</span></label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={commissionData.amount}
                      onChange={handleCommissionChange}
                      placeholder="Enter commission amount"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="month">Month <span className="required">*</span></label>
                    <select
                      id="month"
                      name="month"
                      value={commissionData.month}
                      onChange={handleCommissionChange}
                      required
                    >
                      <option value="">Select Month</option>
                      {months.map((month, index) => (
                        <option key={index} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowCommissionForm(false);
                      setCommissionData({ employeeId: '', amount: '', month: '' });
                      setCommissionError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={submittingCommission}>
                    {submittingCommission ? 'Adding...' : 'Add Commission'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="salary-table-container">
            {loading ? (
              <div className="empty-state">
                <p>Loading salary information...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="empty-state">
                <p>No employees added yet.</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="empty-state">
                <p>No salary records match your search.</p>
              </div>
            ) : (
              <table className="salary-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Basic Salary (LKR)</th>
                    <th>Commission (LKR)</th>
                    <th>Commission Months</th>
                    <th>Total Salary (LKR)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    // Use filtered commissions if months are selected, otherwise use all
                    const displayCommissions = selectedMonths.length > 0
                      ? (employee.filteredMonthlyCommissions || [])
                      : (employee.monthlyCommissions || []);
                    const displayCommission = selectedMonths.length > 0
                      ? (employee.filteredCommission || 0)
                      : (employee.commission || 0);
                    const employeeTotal = (employee.basicSalary || 0) + displayCommission;
                    
                    return (
                      <tr key={employee._id}>
                        <td>{employee.name}</td>
                        <td><span className="role-badge">{employee.role}</span></td>
                        <td className="salary-amount">LKR {employee.basicSalary?.toLocaleString() || 0}</td>
                        <td className="commission-amount">LKR {displayCommission.toLocaleString()}</td>
                        <td className="commission-months-cell">
                          {displayCommissions.length > 0 ? (
                            <div className="commission-months-list">
                              {displayCommissions.map((mc, index) => (
                                <span key={index} className="commission-month-badge">
                                  {mc.month}: LKR {mc.amount?.toLocaleString() || 0}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-commission">No commissions</span>
                          )}
                        </td>
                        <td className="total-salary-amount">LKR {employeeTotal.toLocaleString()}</td>
                        <td>
                          <button
                            className="edit-commission-btn"
                            onClick={() => handleEditCommission(employee)}
                            title="Edit Commission"
                          >
                            Edit 
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td colSpan="6"><strong>Total</strong></td>
                    <td className="salary-amount total-amount-cell"><strong>LKR {totalSalary.toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Edit Commission Modal */}
          {showEditCommissionModal && editingCommission && (
            <div className="modal-overlay">
              <div className="commission-form-container">
                <h2>Edit Commission - {editingCommission.employeeName}</h2>
                <form onSubmit={handleUpdateCommission} className="commission-form">
                  {commissionError && <div className="error-message">{commissionError}</div>}
                  
                  {/* Existing Monthly Commissions */}
                  {editingCommission.monthlyCommissions && editingCommission.monthlyCommissions.length > 0 && (
                    <div className="existing-commissions-section">
                      <h3>Existing Monthly Commissions</h3>
                      <div className="commissions-list">
                        {editingCommission.monthlyCommissions.map((mc, index) => (
                          <div key={index} className="commission-item">
                            <span className="commission-month">{mc.month}</span>
                            <span className="commission-amount-value">LKR {mc.amount?.toLocaleString() || 0}</span>
                            <button
                              type="button"
                              className="delete-commission-btn"
                              onClick={() => handleDeleteMonthlyCommission(editingCommission.employeeId, mc.month)}
                              title="Delete this commission"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-month" >Select Month <span className="required">*</span></label>
                      <select
                        id="edit-month"
                        name="selectedMonth"
                        value={editingCommission.selectedMonth}
                        onChange={handleEditCommissionChange}
                        required
                      >
                        <option value="" disabled >Select Month</option>
                        {months.map((month, index) => (
                          <option key={index} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-amount">Commission Amount (LKR) <span className="required">*</span></label>
                      <input
                        type="number"
                        id="edit-amount"
                        name="amount"
                        value={editingCommission.amount}
                        onChange={handleEditCommissionChange}
                        placeholder="Enter commission amount"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={() => {
                        setShowEditCommissionModal(false);
                        setEditingCommission(null);
                        setCommissionError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={submittingCommission}>
                      {submittingCommission ? 'Updating...' : 'Update Commission'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryPage;

