import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import './PaymentPage.css';

const PaymentPage = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPayments, setFetchingPayments] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    selectedSubjects: [],
    selectedMonths: [],
    paymentMethod: '',
    paymentDate: ''
  });
  const [editFormData, setEditFormData] = useState({
    selectedSubjects: [],
    month: '',
    paymentMethod: '',
    paymentDate: ''
  });
  const [totalFee, setTotalFee] = useState(0);

  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Admin';

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    fetchPayments();
  }, []);

  useEffect(() => {
    // Calculate total fee when selected subjects or months change
    if (formData.selectedSubjects.length > 0 && selectedStudent && formData.selectedMonths.length > 0) {
      const subjectTotal = formData.selectedSubjects.reduce((sum, subjectId) => {
        const subject = subjects.find(s => s._id === subjectId);
        return sum + (subject ? subject.price : 0);
      }, 0);
      // Multiply by number of selected months
      setTotalFee(subjectTotal * formData.selectedMonths.length);
    } else {
      setTotalFee(0);
    }
  }, [formData.selectedSubjects, formData.selectedMonths, subjects, selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/subjects');
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchPayments = async () => {
    setFetchingPayments(true);
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setFetchingPayments(false);
    }
  };

  const handleStudentIdChange = (e) => {
    const studentId = e.target.value.trim();
    setFormData({
      ...formData,
      studentId,
      selectedSubjects: [],
      selectedMonths: []
    });
    setSelectedStudent(null);
    setError('');
    setSuccess('');

    if (studentId) {
      const student = students.find(s => s.studentId === studentId);
      if (student) {
        setSelectedStudent(student);
        setError('');
      } else {
        setError('Student ID not found. Please enter a valid registered student ID.');
        setSelectedStudent(null);
      }
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      return {
        ...prev,
        selectedSubjects: isSelected
          ? prev.selectedSubjects.filter(id => id !== subjectId)
          : [...prev.selectedSubjects, subjectId]
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');
  };

  const handleMonthToggle = (month) => {
    setFormData(prev => {
      const isSelected = prev.selectedMonths.includes(month);
      return {
        ...prev,
        selectedMonths: isSelected
          ? prev.selectedMonths.filter(m => m !== month)
          : [...prev.selectedMonths, month]
      };
    });
  };

  const getStudentSubjects = () => {
    if (!selectedStudent || !selectedStudent.subjects) return [];
    
    return selectedStudent.subjects.map(subjectId => {
      const subject = subjects.find(s => {
        if (typeof subjectId === 'object' && subjectId._id) {
          return s._id === subjectId._id;
        }
        return s._id === subjectId;
      });
      return subject;
    }).filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.studentId) {
      setError('Please enter a student ID');
      setLoading(false);
      return;
    }

    if (!selectedStudent) {
      setError('Please enter a valid registered student ID');
      setLoading(false);
      return;
    }

    if (formData.selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      setLoading(false);
      return;
    }

    if (formData.selectedMonths.length === 0) {
      setError('Please select at least one month');
      setLoading(false);
      return;
    }

    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      setLoading(false);
      return;
    }

    if (!formData.paymentDate) {
      setError('Please select a payment date');
      setLoading(false);
      return;
    }

    try {
      // Calculate price per month
      const pricePerMonth = formData.selectedSubjects.reduce((sum, subjectId) => {
        const subject = subjects.find(s => s._id === subjectId);
        return sum + (subject ? subject.price : 0);
      }, 0);

      // Create payment records for each selected month
      const paymentPromises = formData.selectedMonths.map(async (month) => {
        const paymentData = {
          studentId: selectedStudent._id,
          studentIdNumber: formData.studentId,
          subjects: formData.selectedSubjects,
          totalAmount: pricePerMonth,
          month: month,
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate
        };

        const response = await fetch('https://lms-f679.onrender.com/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(paymentData)
        });

        return response.json();
      });

      const results = await Promise.all(paymentPromises);
      const failed = results.filter(r => !r.success);
      
      if (failed.length === 0) {
        setSuccess(`Payment recorded successfully for ${formData.selectedMonths.length} month(s)!`);
        setFormData({
          studentId: '',
          selectedSubjects: [],
          selectedMonths: [],
          paymentMethod: '',
          paymentDate: ''
        });
        setSelectedStudent(null);
        setTotalFee(0);
        fetchPayments(); // Refresh payments list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(failed[0].message || 'Failed to record some payments');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    const paymentDate = payment.paymentDate 
      ? new Date(payment.paymentDate).toISOString().split('T')[0]
      : '';
    
    const subjectIds = payment.subjects?.map(subject => {
      return typeof subject === 'object' ? subject._id : subject;
    }) || [];

    setEditFormData({
      selectedSubjects: subjectIds,
      month: payment.month || '',
      paymentMethod: payment.paymentMethod || '',
      paymentDate: paymentDate
    });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (editFormData.selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      setLoading(false);
      return;
    }

    if (!editFormData.month) {
      setError('Please select a month');
      setLoading(false);
      return;
    }

    if (!editFormData.paymentMethod) {
      setError('Please select a payment method');
      setLoading(false);
      return;
    }

    if (!editFormData.paymentDate) {
      setError('Please select a payment date');
      setLoading(false);
      return;
    }

    try {
      // Calculate total amount from selected subjects
      const editTotalFee = editFormData.selectedSubjects.reduce((sum, subjectId) => {
        const subject = subjects.find(s => s._id === subjectId);
        return sum + (subject ? subject.price : 0);
      }, 0);

      const paymentData = {
        subjects: editFormData.selectedSubjects,
        totalAmount: editTotalFee,
        month: editFormData.month,
        paymentMethod: editFormData.paymentMethod,
        paymentDate: editFormData.paymentDate
      };

      const response = await fetch(`https://lms-f679.onrender.com/api/payments/${editingPayment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Payment updated successfully!');
        setShowEditModal(false);
        setEditingPayment(null);
        fetchPayments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update payment');
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Payment deleted successfully!');
        fetchPayments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete payment');
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubjectToggle = (subjectId) => {
    setEditFormData(prev => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      return {
        ...prev,
        selectedSubjects: isSelected
          ? prev.selectedSubjects.filter(id => id !== subjectId)
          : [...prev.selectedSubjects, subjectId]
      };
    });
  };

  const getEditStudentSubjects = () => {
    if (!editingPayment || !editingPayment.studentId) return [];
    
    const student = students.find(s => {
      if (typeof editingPayment.studentId === 'object') {
        return s._id === editingPayment.studentId._id;
      }
      return s._id === editingPayment.studentId;
    });

    if (!student || !student.subjects) return [];
    
    return student.subjects.map(subjectId => {
      const subject = subjects.find(s => {
        if (typeof subjectId === 'object' && subjectId._id) {
          return s._id === subjectId._id;
        }
        return s._id === subjectId;
      });
      return subject;
    }).filter(Boolean);
  };

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return payments;
    }
    return payments.filter((payment) => {
      const studentId = payment.studentIdNumber || (payment.studentId?.studentId || '');
      const studentName = payment.studentId?.name || '';
      return (
        studentId.toLowerCase().includes(term) ||
        studentName.toLowerCase().includes(term)
      );
    });
  }, [payments, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredPayments.length) {
      alert('No payments available to generate a report.');
      return;
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Subjects',
      'Total Amount (LKR)',
      'Month',
      'Payment Method',
      'Payment Date'
    ];

    const rows = filteredPayments.map((payment) => {
      const subjectNames = payment.subjects?.map(subject => {
        return typeof subject === 'object' ? subject.name : 'Unknown';
      }).join(', ') || 'None';

      return [
        payment.studentIdNumber || (payment.studentId?.studentId || ''),
        payment.studentId?.name || '',
        subjectNames,
        payment.totalAmount?.toFixed(2) || '0.00',
        payment.month || '',
        payment.paymentMethod || '',
        payment.paymentDate
          ? new Date(payment.paymentDate).toISOString().slice(0, 10)
          : ''
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
    link.download = `payments-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const paymentMethods = ['Cash', 'Card', 'Bank Transfer'];

  const studentSubjects = getStudentSubjects();

  return (
    <div className="payment-page">
      <Sidebar />
      <div className="admin-content">
        <Topbar userName={userName} />
        <div className="payment-container">
          <div className="payment-header">
            <h1>Payment</h1>
            <p className="payment-subtitle">Record student payments for subjects</p>
          </div>

          <form className="payment-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="studentId">Student ID *</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleStudentIdChange}
                placeholder="Enter student ID"
                required
              />
              {selectedStudent && (
                <div className="student-info">
                  <p><strong>Student:</strong> {selectedStudent.name}</p>
                  <p><strong>Email:</strong> {selectedStudent.email}</p>
                </div>
              )}
            </div>

            {selectedStudent && (
              <>
                <div className="form-group">
                  <label>Select Subjects *</label>
                  <div className="subjects-selection">
                    {studentSubjects.length === 0 ? (
                      <p className="no-subjects">No subjects registered for this student</p>
                    ) : (
                      <div className="subjects-checkbox-list">
                        {studentSubjects.map((subject) => (
                          <label key={subject._id} className="subject-checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.selectedSubjects.includes(subject._id)}
                              onChange={() => handleSubjectToggle(subject._id)}
                            />
                            <span>{subject.name} - LKR {subject.price.toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {totalFee > 0 && (
                    <div className="total-fee-display">
                      <div className="fee-breakdown">
                        <div>Price per month: <strong>LKR {((totalFee / formData.selectedMonths.length) || 0).toFixed(2)}</strong></div>
                        <div>Number of months: <strong>{formData.selectedMonths.length}</strong></div>
                      </div>
                      <div className="fee-total">
                        <strong>Total Fee: LKR {totalFee.toFixed(2)}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Payment Month(s) *</label>
                  <div className="months-selection">
                    <div className="months-checkbox-list">
                      {months.map((month, index) => (
                        <label key={index} className="month-checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.selectedMonths.includes(month)}
                            onChange={() => handleMonthToggle(month)}
                          />
                          <span>{month}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.selectedMonths.length > 0 && (
                    <div className="selected-months-display">
                      <small>Selected: {formData.selectedMonths.join(', ')}</small>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method *</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select Payment Method</option>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentDate">Payment Date *</label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Record Payment'}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setFormData({
                        studentId: '',
                        selectedSubjects: [],
                        selectedMonths: [],
                        paymentMethod: '',
                        paymentDate: ''
                      });
                      setSelectedStudent(null);
                      setTotalFee(0);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Payments List Section */}
          <div className="payments-list-section">
            <div className="payments-list-header">
              <h2>Payment Records</h2>
              <div className="header-actions">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search by student ID or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                      &times;
                    </button>
                  )}
                </div>
                <button
                  className="generate-report-btn"
                  onClick={handleGenerateReport}
                  disabled={filteredPayments.length === 0}
                >
                  Generate Report
                </button>
              </div>
            </div>

            {fetchingPayments && payments.length === 0 ? (
              <div className="loading-message">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="no-payments">
                {searchTerm ? 'No payment records found matching your search' : 'No payment records found'}
              </div>
            ) : (
              <div className="payments-table-container">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Subjects</th>
                      <th>Total Amount</th>
                      <th>Month</th>
                      <th>Payment Method</th>
                      <th>Payment Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td>{payment.studentIdNumber || (payment.studentId?.studentId || '-')}</td>
                        <td>{payment.studentId?.name || '-'}</td>
                        <td>
                          {payment.subjects && payment.subjects.length > 0 ? (
                            <div className="subjects-list">
                              {payment.subjects.map((subject, idx) => (
                                <span key={idx} className="subject-tag">
                                  {typeof subject === 'object' ? subject.name : 'Unknown'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="amount-cell">LKR {payment.totalAmount?.toFixed(2) || '0.00'}</td>
                        <td>{payment.month || '-'}</td>
                        <td>{payment.paymentMethod || '-'}</td>
                        <td>
                          {payment.paymentDate
                            ? new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : '-'}
                        </td>
                        <td>
                          <div className="payment-actions">
                            <button
                              className="edit-payment-btn"
                              onClick={() => handleEdit(payment)}
                              title="Edit Payment"
                            >
                              Edit
                            </button>
                            <button
                              className="delete-payment-btn"
                              onClick={() => handleDelete(payment._id)}
                              title="Delete Payment"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Payment Modal */}
          {showEditModal && editingPayment && (
            <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
              <div className="modal-content payment-edit-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Payment</h2>
                <p className="modal-subtitle">
                  Student: {editingPayment.studentId?.name || editingPayment.studentIdNumber || 'Unknown'}
                </p>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleEditSubmit}>
                  <div className="form-group">
                    <label>Select Subjects *</label>
                    <div className="subjects-selection">
                      {getEditStudentSubjects().length === 0 ? (
                        <p className="no-subjects">No subjects available</p>
                      ) : (
                        <div className="subjects-checkbox-list">
                          {getEditStudentSubjects().map((subject) => (
                            <label key={subject._id} className="subject-checkbox-item">
                              <input
                                type="checkbox"
                                checked={editFormData.selectedSubjects.includes(subject._id)}
                                onChange={() => handleEditSubjectToggle(subject._id)}
                              />
                              <span>{subject.name} - LKR {subject.price.toFixed(2)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {editFormData.selectedSubjects.length > 0 && (
                      <div className="total-fee-display">
                        <strong>
                          Total Fee: LKR {editFormData.selectedSubjects.reduce((sum, subjectId) => {
                            const subject = subjects.find(s => s._id === subjectId);
                            return sum + (subject ? subject.price : 0);
                          }, 0).toFixed(2)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="editMonth">Payment Month *</label>
                    <select
                      id="editMonth"
                      name="month"
                      value={editFormData.month}
                      onChange={(e) => setEditFormData({ ...editFormData, month: e.target.value })}
                      required
                    >
                      <option value="">Select Month</option>
                      {months.map((month, index) => (
                        <option key={index} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editPaymentMethod">Payment Method *</label>
                    <select
                      id="editPaymentMethod"
                      name="paymentMethod"
                      value={editFormData.paymentMethod}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editPaymentDate">Payment Date *</label>
                    <input
                      type="date"
                      id="editPaymentDate"
                      name="paymentDate"
                      value={editFormData.paymentDate}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Payment'}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingPayment(null);
                        setError('');
                        setSuccess('');
                      }}
                    >
                      Cancel
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

export default PaymentPage;

