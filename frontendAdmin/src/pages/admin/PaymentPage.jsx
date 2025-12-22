import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
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
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [editFormData, setEditFormData] = useState({
    selectedSubjects: [],
    selectedMonths: [],
    paymentMethod: '',
    paymentDate: ''
  });
  const [editTotalFee, setEditTotalFee] = useState(0);
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
    // Use student's subjectPrices (prices entered when student was added) instead of subject default prices
    if (formData.selectedSubjects.length > 0 && selectedStudent && formData.selectedMonths.length > 0) {
      const subjectTotal = formData.selectedSubjects.reduce((sum, subjectId) => {
        // First try to get price from student's subjectPrices
        if (selectedStudent.subjectPrices && Array.isArray(selectedStudent.subjectPrices)) {
          const subjectPrice = selectedStudent.subjectPrices.find(sp => {
            const spId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
            return spId === subjectId;
          });
          if (subjectPrice) {
            return sum + (subjectPrice.price || 0);
          }
        }
        // Fallback to subject's default price if no student-specific price found
        const subject = subjects.find(s => s._id === subjectId);
        return sum + (subject ? (subject.price || 0) : 0);
      }, 0);
      // Multiply by number of selected months
      setTotalFee(subjectTotal * formData.selectedMonths.length);
    } else {
      setTotalFee(0);
    }
  }, [formData.selectedSubjects, formData.selectedMonths, subjects, selectedStudent]);

  useEffect(() => {
    // Calculate total fee for edit form when selected subjects or months change
    if (editFormData.selectedSubjects && editFormData.selectedSubjects.length > 0 && editingPayment && editFormData.selectedMonths && editFormData.selectedMonths.length > 0) {
      const editStudent = students.find(s => {
        if (typeof editingPayment.studentId === 'object') {
          return s._id === editingPayment.studentId._id;
        }
        return s._id === editingPayment.studentId;
      });

      const subjectTotal = editFormData.selectedSubjects.reduce((sum, subjectId) => {
        // First try to get price from student's subjectPrices
        if (editStudent && editStudent.subjectPrices && Array.isArray(editStudent.subjectPrices)) {
          const subjectPrice = editStudent.subjectPrices.find(sp => {
            const spId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
            return spId === subjectId;
          });
          if (subjectPrice) {
            return sum + (subjectPrice.price || 0);
          }
        }
        // Fallback to subject's default price if no student-specific price found
        const subject = subjects.find(s => s._id === subjectId);
        return sum + (subject ? (subject.price || 0) : 0);
      }, 0);
      // Multiply by number of selected months
      setEditTotalFee(subjectTotal * editFormData.selectedMonths.length);
    } else {
      setEditTotalFee(0);
    }
  }, [editFormData.selectedSubjects, editFormData.selectedMonths, subjects, editingPayment, students]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students`, {
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
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
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
      const response = await fetch(`${API_CONFIG.API_URL}/payments`, {
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

  // Get student suggestions based on search input
  const getStudentSuggestions = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const suggestions = [];

    students.forEach(student => {
      const studentName = (student.name || '').trim().toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      
      // Check if search matches student ID
      if (studentId.includes(searchLower)) {
        suggestions.push({
          ...student,
          matchType: 'ID',
          displayText: `${student.name} (ID: ${student.studentId})`
        });
        return;
      }

      // Split student's full name into parts
      const nameParts = studentName.split(/\s+/).filter(part => part.length > 0);
      const firstName = nameParts.length > 0 ? nameParts[0] : '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      const fullName = studentName;

      // Check if search matches first name, last name, or full name (partial match)
      const matchesFirstName = firstName && firstName.startsWith(searchLower);
      const matchesLastName = lastName && lastName.startsWith(searchLower);
      const matchesFullName = fullName.includes(searchLower);
      
      // Check if search matches any part of the name
      const matchesAnyPart = nameParts.some(part => part.startsWith(searchLower));

      if (matchesFirstName || matchesLastName || matchesFullName || matchesAnyPart) {
        suggestions.push({
          ...student,
          matchType: 'Name',
          displayText: `${student.name} (ID: ${student.studentId})`
        });
      }
    });

    // Sort: exact ID matches first, then name matches
    return suggestions.sort((a, b) => {
      if (a.matchType === 'ID' && b.matchType !== 'ID') return -1;
      if (a.matchType !== 'ID' && b.matchType === 'ID') return 1;
      return a.name.localeCompare(b.name);
    }).slice(0, 10); // Limit to 10 suggestions
  };

  const handleStudentSearchChange = (e) => {
    const searchTerm = e.target.value;
    setStudentSearchInput(searchTerm);
    
    if (searchTerm.trim()) {
      const suggestions = getStudentSuggestions(searchTerm);
      setStudentSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }

    setSelectedStudent(null);
    setFormData({
      ...formData,
      studentId: '',
      selectedSubjects: [],
      selectedMonths: []
    });
    setError('');
    setSuccess('');
  };

  const handleStudentSuggestionSelect = (student) => {
    setStudentSearchInput(`${student.name} (ID: ${student.studentId})`);
    setFormData({
      ...formData,
      studentId: student.studentId, // Store the actual student ID for SMS
      selectedSubjects: [],
      selectedMonths: []
    });
    setSelectedStudent(student);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setError('');
  };

  const handleStudentIdChange = (e) => {
    handleStudentSearchChange(e);
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
      const subjectIdValue = typeof subjectId === 'object' ? subjectId._id : subjectId;
      const subject = subjects.find(s => s._id === subjectIdValue);
      
      if (!subject) return null;
      
      // Get price from student's subjectPrices if available
      let studentPrice = null;
      if (selectedStudent.subjectPrices && Array.isArray(selectedStudent.subjectPrices)) {
        const subjectPrice = selectedStudent.subjectPrices.find(sp => {
          const spId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
          return spId === subjectIdValue;
        });
        if (subjectPrice) {
          studentPrice = subjectPrice.price;
        }
      }
      
      return {
        ...subject,
        studentPrice: studentPrice !== null ? studentPrice : subject.price
      };
    }).filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.studentId || !selectedStudent) {
      setError('Please select a student from the suggestions or enter a valid Student ID, first name, last name, or full name');
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
      // Calculate price per month using student's subjectPrices
      const pricePerMonth = formData.selectedSubjects.reduce((sum, subjectId) => {
        // First try to get price from student's subjectPrices
        if (selectedStudent.subjectPrices && Array.isArray(selectedStudent.subjectPrices)) {
          const subjectPrice = selectedStudent.subjectPrices.find(sp => {
            const spId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
            return spId === subjectId;
          });
          if (subjectPrice) {
            return sum + (subjectPrice.price || 0);
          }
        }
        // Fallback to subject's default price if no student-specific price found
        const subject = subjects.find(s => s._id === subjectId);
        return sum + (subject ? (subject.price || 0) : 0);
      }, 0);

      // Create a single payment record with all selected months combined
      // Join months with comma for multiple months
      const monthsCombined = formData.selectedMonths.join(', ');
      const totalAmount = pricePerMonth * formData.selectedMonths.length;
      
      const paymentData = {
        studentId: selectedStudent._id,
        studentIdNumber: formData.studentId,
        subjects: formData.selectedSubjects,
        totalAmount: totalAmount,
        month: monthsCombined,
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate
      };

      const response = await fetch(`${API_CONFIG.API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
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
        setError(data.message || 'Failed to record payment');
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

    // Parse month string (e.g., "January, February") into array
    const selectedMonths = payment.month 
      ? payment.month.split(',').map(m => m.trim()).filter(m => m)
      : [];

    setEditFormData({
      selectedSubjects: subjectIds,
      selectedMonths: selectedMonths,
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

    if (!editFormData.selectedMonths || editFormData.selectedMonths.length === 0) {
      setError('Please select at least one month');
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
      // Join months with comma for multiple months (same as create)
      const monthsCombined = (editFormData.selectedMonths || []).join(', ');

      const paymentData = {
        subjects: editFormData.selectedSubjects,
        totalAmount: editTotalFee,
        month: monthsCombined,
        paymentMethod: editFormData.paymentMethod,
        paymentDate: editFormData.paymentDate
      };

      const response = await fetch(`${API_CONFIG.API_URL}/payments/${editingPayment._id}`, {
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
        setEditFormData({
          selectedSubjects: [],
          selectedMonths: [],
          paymentMethod: '',
          paymentDate: ''
        });
        setEditTotalFee(0);
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
      const response = await fetch(`${API_CONFIG.API_URL}/payments/${paymentId}`, {
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

  const handleEditMonthToggle = (month) => {
    setEditFormData(prev => {
      const currentMonths = prev.selectedMonths || [];
      const isSelected = currentMonths.includes(month);
      return {
        ...prev,
        selectedMonths: isSelected
          ? currentMonths.filter(m => m !== month)
          : [...currentMonths, month]
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
      const subjectIdValue = typeof subjectId === 'object' ? subjectId._id : subjectId;
      const subject = subjects.find(s => s._id === subjectIdValue);
      
      if (!subject) return null;
      
      // Get price from student's subjectPrices if available
      let studentPrice = null;
      if (student.subjectPrices && Array.isArray(student.subjectPrices)) {
        const subjectPrice = student.subjectPrices.find(sp => {
          const spId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
          return spId === subjectIdValue;
        });
        if (subjectPrice) {
          studentPrice = subjectPrice.price;
        }
      }
      
      return {
        ...subject,
        studentPrice: studentPrice !== null ? studentPrice : subject.price
      };
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
              <label htmlFor="studentId">Student ID or Name *</label>
              <div className="student-search-container" style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={studentSearchInput || (selectedStudent ? `${selectedStudent.name} (ID: ${selectedStudent.studentId})` : '')}
                  onChange={handleStudentSearchChange}
                  onFocus={() => {
                    if (studentSearchInput) {
                      const suggestions = getStudentSuggestions(studentSearchInput);
                      setStudentSuggestions(suggestions);
                      setShowSuggestions(suggestions.length > 0);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Type Student ID, first name, last name, or full name..."
                  required
                  autoComplete="off"
                />
                {showSuggestions && studentSuggestions.length > 0 && (
                  <div className="student-suggestions-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {studentSuggestions.map((student, index) => (
                      <div
                        key={student._id || index}
                        onClick={() => handleStudentSuggestionSelect(student)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: index < studentSuggestions.length - 1 ? '1px solid #eee' : 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>ID: {student.studentId}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedStudent && (
                <div className="student-info">
                  <p><strong>Student:</strong> {selectedStudent.name}</p>
                  <p><strong>Email:</strong> {selectedStudent.email}</p>
                  {selectedStudent.totalPrice !== undefined && selectedStudent.totalPrice !== null && (
                    <p><strong>Total Price :</strong> LKR {selectedStudent.totalPrice.toFixed(2)}</p>
                  )}
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
                            <span>{subject.name} - LKR {(subject.studentPrice || subject.price || 0).toFixed(2)}</span>
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
            <div className="modal-overlay" onClick={() => {
              setShowEditModal(false);
              setEditingPayment(null);
              setEditFormData({
                selectedSubjects: [],
                selectedMonths: [],
                paymentMethod: '',
                paymentDate: ''
              });
              setEditTotalFee(0);
            }}>
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
                              <span>{subject.name} - LKR {(subject.studentPrice || subject.price || 0).toFixed(2)}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {editFormData.selectedSubjects && editFormData.selectedSubjects.length > 0 && editFormData.selectedMonths && editFormData.selectedMonths.length > 0 && (
                      <div className="total-fee-display">
                        <div className="fee-breakdown">
                          <div>Price per month: <strong>LKR {((editTotalFee / (editFormData.selectedMonths?.length || 1)) || 0).toFixed(2)}</strong></div>
                          <div>Number of months: <strong>{editFormData.selectedMonths?.length || 0}</strong></div>
                        </div>
                        <div className="fee-total">
                          <strong>Total Fee: LKR {editTotalFee.toFixed(2)}</strong>
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
                              checked={editFormData.selectedMonths && editFormData.selectedMonths.includes(month)}
                              onChange={() => handleEditMonthToggle(month)}
                            />
                            <span>{month}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {editFormData.selectedMonths && editFormData.selectedMonths.length > 0 && (
                      <div className="selected-months-display">
                        <small>Selected: {editFormData.selectedMonths.join(', ')}</small>
                      </div>
                    )}
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
                        setEditFormData({
                          selectedSubjects: [],
                          selectedMonths: [],
                          paymentMethod: '',
                          paymentDate: ''
                        });
                        setEditTotalFee(0);
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

