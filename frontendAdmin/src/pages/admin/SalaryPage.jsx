import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import './SalaryPage.css';

const SalaryPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [commissionData, setCommissionData] = useState({
    employeeId: '',
    amount: ''
  });
  const [commissionError, setCommissionError] = useState('');
  const [submittingCommission, setSubmittingCommission] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/admin/employees', {
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
    
    if (!commissionData.employeeId || !commissionData.amount) {
      setCommissionError('Please select a teacher and enter an amount');
      return;
    }

    const amount = parseFloat(commissionData.amount);
    if (isNaN(amount) || amount < 0) {
      setCommissionError('Please enter a valid amount');
      return;
    }

    setSubmittingCommission(true);
    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/admin/employees/${commissionData.employeeId}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commission: amount })
      });

      const data = await response.json();

      if (data.success) {
        await fetchEmployees();
        setCommissionData({ employeeId: '', amount: '' });
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

  const filteredEmployees = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return employees;
    }
    return employees.filter((employee) =>
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
  }, [employees, searchTerm]);

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
      const total = (employee.basicSalary || 0) + (employee.commission || 0);
      return [
        employee.name || '',
        employee.role || '',
        employee.basicSalary ?? 0,
        employee.commission ?? 0,
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
                className="report-btn"
                onClick={handleGenerateReport}
                disabled={filteredEmployees.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-commission-btn" 
                onClick={() => setShowCommissionForm(!showCommissionForm)}
              >
                {showCommissionForm ? 'Cancel' : '+ Add Commission'}
              </button>
            </div>
          </div>

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
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowCommissionForm(false);
                      setCommissionData({ employeeId: '', amount: '' });
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
                    <th>Total Salary (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const employeeTotal = (employee.basicSalary || 0) + (employee.commission || 0);
                    return (
                      <tr key={employee._id}>
                        <td>{employee.name}</td>
                        <td><span className="role-badge">{employee.role}</span></td>
                        <td className="salary-amount">LKR {employee.basicSalary?.toLocaleString() || 0}</td>
                        <td className="commission-amount">LKR {employee.commission?.toLocaleString() || 0}</td>
                        <td className="total-salary-amount">LKR {employeeTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td colSpan="4"><strong>Total</strong></td>
                    <td className="salary-amount total-amount-cell"><strong>LKR {totalSalary.toLocaleString()}</strong></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryPage;

