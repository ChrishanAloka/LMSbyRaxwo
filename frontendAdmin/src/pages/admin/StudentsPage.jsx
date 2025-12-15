import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import './StudentsPage.css';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    birthday: '',
    gender: '',
    mobile: '',
    selectedSubjects: [],
    subjectPrices: {}, // Store prices as { subjectId: price }
    guardianTelephone: '',
    guardianName: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);


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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  // Handle mobile number input with +94 prefix
  const handleMobileChange = (e) => {
    let value = e.target.value;
    
    // Remove any non-digit characters except + at the start
    value = value.replace(/[^\d+]/g, '');
    
    // If user types +94, keep it, otherwise if starts with 0, remove it
    if (value.startsWith('+94')) {
      // Remove +94 prefix for display, user will enter the rest
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      // Remove leading 0
      value = value.substring(1);
    }
    
    // Only allow digits after removing prefix
    value = value.replace(/\D/g, '');
    
    setFormData({
      ...formData,
      mobile: value
    });
    setError('');
  };

  // Handle guardian telephone number input with +94 prefix
  const handleGuardianTelephoneChange = (e) => {
    let value = e.target.value;
    
    // Remove any non-digit characters except + at the start
    value = value.replace(/[^\d+]/g, '');
    
    // If user types +94, keep it, otherwise if starts with 0, remove it
    if (value.startsWith('+94')) {
      // Remove +94 prefix for display, user will enter the rest
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      // Remove leading 0
      value = value.substring(1);
    }
    
    // Only allow digits after removing prefix
    value = value.replace(/\D/g, '');
    
    setFormData({
      ...formData,
      guardianTelephone: value
    });
    setError('');
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      const newSelectedSubjects = isSelected
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];
      
      // Update subjectPrices: remove price when unselected, add default price when selected
      const newSubjectPrices = { ...prev.subjectPrices };
      if (isSelected) {
        // Remove price when unselecting
        delete newSubjectPrices[subjectId];
      } else {
        // When selecting, initialize with subject's default price if available, otherwise empty string
        const subject = subjects.find(s => s._id === subjectId);
        newSubjectPrices[subjectId] = subject?.price || '';
      }
      
      return {
        ...prev,
        selectedSubjects: newSelectedSubjects,
        subjectPrices: newSubjectPrices
      };
    });
  };

  const handleSubjectPriceChange = (subjectId, price) => {
    // Store as string to preserve exact value entered by user
    // Only validate that it's a valid number format, but keep as string
    const trimmedPrice = price.trim();
    if (trimmedPrice === '') {
      setFormData(prev => ({
        ...prev,
        subjectPrices: {
          ...prev.subjectPrices,
          [subjectId]: ''
        }
      }));
      return;
    }
    
    // Allow only numbers and one decimal point
    const validPrice = trimmedPrice.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = validPrice.split('.');
    const formattedPrice = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : validPrice;
    
    setFormData(prev => ({
      ...prev,
      subjectPrices: {
        ...prev.subjectPrices,
        [subjectId]: formattedPrice
      }
    }));
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    
    // Format birthday for date input (YYYY-MM-DD)
    const birthdayDate = student.birthday ? new Date(student.birthday).toISOString().split('T')[0] : '';
    
    // Extract subject IDs (handle both populated objects and IDs)
    const subjectIds = student.subjects?.map(subject => {
      return typeof subject === 'object' ? subject._id : subject;
    }) || [];
    
    // Extract subject prices into an object
    const subjectPricesObj = {};
    if (student.subjectPrices && Array.isArray(student.subjectPrices)) {
      student.subjectPrices.forEach(sp => {
        const subjId = typeof sp.subjectId === 'object' ? (sp.subjectId?._id || sp.subjectId) : sp.subjectId;
        if (subjId) {
          subjectPricesObj[subjId] = sp.price || 0;
        }
      });
    }
    // If no subjectPrices exist, initialize with default prices from subjects
    subjectIds.forEach(subjectId => {
      if (!subjectPricesObj[subjectId]) {
        const subject = subjects.find(s => s._id === subjectId);
        subjectPricesObj[subjectId] = subject?.price || 0;
      }
    });
    
    const nameParts = (student.name || '').trim().split(/\s+/);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');

    setFormData({
      firstName,
      lastName,
      studentId: student.studentId || '',
      email: student.email || '',
      birthday: birthdayDate,
      gender: student.gender || '',
      mobile: (() => {
        // Format mobile number for display (remove +94 prefix if present, remove leading 0)
        let mobile = student.mobile || '';
        if (mobile) {
          if (mobile.startsWith('+94')) {
            mobile = mobile.substring(3);
          }
          if (mobile.startsWith('0')) {
            mobile = mobile.substring(1);
          }
          mobile = mobile.replace(/\D/g, '');
        }
        return mobile;
      })(),
      selectedSubjects: subjectIds,
      subjectPrices: subjectPricesObj,
      guardianTelephone: (() => {
        // Format guardian telephone for display (remove +94 prefix if present, remove leading 0)
        let guardianTel = student.guardianTelephone || '';
        if (guardianTel) {
          // Remove +94 prefix if present
          if (guardianTel.startsWith('+94')) {
            guardianTel = guardianTel.substring(3);
          }
          // Remove leading 0 if present
          if (guardianTel.startsWith('0')) {
            guardianTel = guardianTel.substring(1);
          }
          // Remove any non-digit characters
          guardianTel = guardianTel.replace(/\D/g, '');
        }
        return guardianTel;
      })(),
      guardianName: (() => {
        const guardianFirst = student.guardianFirstName || '';
        const guardianLast = student.guardianLastName || '';
        const combined = `${guardianFirst} ${guardianLast}`.trim();
        return combined || '';
      })()
    });
    
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      studentId: '',
      email: '',
      birthday: '',
      gender: '',
      mobile: '',
      selectedSubjects: [],
      subjectPrices: {},
      guardianTelephone: '',
      guardianName: ''
    });
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Trim and validate required fields
    const trimmedFirstName = (formData.firstName || '').trim();
    const trimmedLastName = (formData.lastName || '').trim();
    const trimmedStudentId = (formData.studentId || '').trim();
    const trimmedEmail = (formData.email || '').trim();
    const trimmedGuardianName = (formData.guardianName || '').trim();
    
    // Format mobile number: remove leading 0, ensure it starts with +94
    let trimmedMobile = (formData.mobile || '').trim();
    if (trimmedMobile) {
      // Remove any non-digit characters
      trimmedMobile = trimmedMobile.replace(/\D/g, '');
      // Remove leading 0 if present
      if (trimmedMobile.startsWith('0')) {
        trimmedMobile = trimmedMobile.substring(1);
      }
      // Add +94 prefix
      trimmedMobile = '+94' + trimmedMobile;
    }

    // Format guardian telephone number: remove leading 0, ensure it starts with +94
    let trimmedGuardianTelephone = (formData.guardianTelephone || '').trim();
    if (trimmedGuardianTelephone) {
      // Remove any non-digit characters
      trimmedGuardianTelephone = trimmedGuardianTelephone.replace(/\D/g, '');
      // Remove leading 0 if present
      if (trimmedGuardianTelephone.startsWith('0')) {
        trimmedGuardianTelephone = trimmedGuardianTelephone.substring(1);
      }
      // Add +94 prefix
      trimmedGuardianTelephone = '+94' + trimmedGuardianTelephone;
    }

    // Split guardian name into first and last name
    const guardianNameParts = trimmedGuardianName.trim().split(/\s+/);
    const guardianFirstName = guardianNameParts.shift() || '';
    const guardianLastName = guardianNameParts.join(' ') || '';

    // Validate required fields with specific error messages
    if (!trimmedFirstName) {
      setError('Please enter first name');
      setLoading(false);
      return;
    }
    if (!trimmedLastName) {
      setError('Please enter last name');
      setLoading(false);
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter email address');
      setLoading(false);
      return;
    }
    if (!formData.birthday) {
      setError('Please select birthday');
      setLoading(false);
      return;
    }
    if (!formData.gender) {
      setError('Please select gender');
      setLoading(false);
      return;
    }
    if (!trimmedMobile) {
      setError('Please enter mobile number');
      setLoading(false);
      return;
    }
    if (formData.selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      setLoading(false);
      return;
    }

    // Validate that all selected subjects have prices entered
    const missingPrices = formData.selectedSubjects.filter(subjectId => {
      const price = formData.subjectPrices[subjectId];
      // Check if price is missing, empty, or invalid (0 or less)
      if (price === undefined || price === '' || price === null) return true;
      const numPrice = parseFloat(price);
      return isNaN(numPrice) || numPrice <= 0;
    });

    if (missingPrices.length > 0) {
      const missingSubjectNames = missingPrices.map(subjectId => {
        const subject = subjects.find(s => s._id === subjectId);
        return subject?.name || 'Unknown';
      }).join(', ');
      setError(`Please enter a valid price (greater than 0) for the following subjects: ${missingSubjectNames}`);
      setLoading(false);
      return;
    }
    if (!trimmedGuardianTelephone) {
      setError('Please enter guardian telephone number');
      setLoading(false);
      return;
    }
    if (!trimmedGuardianName) {
      setError('Please enter guardian/parent name');
      setLoading(false);
      return;
    }

    try {
      const url = editingStudent 
        ? `${API_CONFIG.API_URL}/students/${editingStudent._id}`
        : `${API_CONFIG.API_URL}/students`;
      
      const method = editingStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${trimmedFirstName} ${trimmedLastName}`.trim(),
          studentId: editingStudent ? trimmedStudentId : '', // Empty string for new students to trigger auto-generation
          email: trimmedEmail,
          birthday: formData.birthday,
          gender: formData.gender,
          mobile: trimmedMobile,
          subjects: formData.selectedSubjects,
          subjectPrices: formData.selectedSubjects.map(subjectId => {
            const price = formData.subjectPrices[subjectId];
            // Convert string to number only when submitting, preserving exact value
            if (price === undefined || price === '' || price === null) {
              return { subjectId: subjectId, price: 0 };
            }
            const numPrice = parseFloat(price);
            // Round to 2 decimal places to avoid floating point issues
            const roundedPrice = isNaN(numPrice) ? 0 : Math.round(numPrice * 100) / 100;
            return {
              subjectId: subjectId,
              price: roundedPrice
            };
          }),
          totalPrice: formData.selectedSubjects.reduce((sum, subjectId) => {
            const price = formData.subjectPrices[subjectId];
            if (price === undefined || price === '' || price === null) return sum;
            const numPrice = parseFloat(price);
            if (isNaN(numPrice)) return sum;
            // Round to 2 decimal places to avoid floating point issues
            const roundedPrice = Math.round(numPrice * 100) / 100;
            return Math.round((sum + roundedPrice) * 100) / 100;
          }, 0),
          // Mark as having guardian info so backend keeps these fields
          hasSpecialNeeds: Boolean(trimmedGuardianName || trimmedGuardianTelephone),
          guardianName: trimmedGuardianName,
          guardianFirstName: guardianFirstName,
          guardianLastName: guardianLastName,
          guardianTelephone: trimmedGuardianTelephone
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchStudents();
        setFormData({
          firstName: '',
          lastName: '',
          studentId: '',
          email: '',
          birthday: '',
          gender: '',
          mobile: '',
          selectedSubjects: [],
          subjectPrices: {},
          guardianTelephone: '',
          guardianName: ''
        });
        setEditingStudent(null);
        setShowForm(false);
        setError('');
      } else {
        // Show specific backend error message
        const errorMessage = data.message || data.error || `Failed to ${editingStudent ? 'update' : 'add'} student`;
        setError(errorMessage);
        console.error('Student submission error:', data);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchStudents();
      } else {
        alert(data.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Network error. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getSubjectNames = (subjectIds) => {
    if (!subjectIds || subjectIds.length === 0) return 'None';
    return subjectIds.map(subject => {
      if (typeof subject === 'object' && subject.name) {
        return subject.name;
      }
      const foundSubject = subjects.find(s => s._id === subject);
      return foundSubject ? foundSubject.name : 'Unknown';
    }).join(', ');
  };

  const getSubjectsWithPrices = (student) => {
    return getSubjectNames(student.subjects);
  };

  const getGuardianName = (student) => {
    if (student.guardianName) {
      return student.guardianName || '-';
    }
    const first = student.guardianFirstName || '';
    const last = student.guardianLastName || '';
    const combined = `${first} ${last}`.trim();
    return combined || '-';
  };

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return students;
    }
    return students.filter((student) =>
      [
        student.name,
        student.studentId,
        student.email,
        student.gender,
        student.mobile,
        getSubjectNames(student.subjects)
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [students, searchTerm, subjects]);

  const handleGenerateReport = () => {
    if (!filteredStudents.length) {
      alert('No students available to generate a report.');
      return;
    }

    const headers = [
      'First Name',
      'Last Name',
      'Student Registration Number',
      'Email Address',
      'Date of Birth',
      'Gender',
      'Primary Contact Number',
      'Enrolled Subjects',
      'Guardian Telephone Number',
      'Guardian/Parent Name'
    ];

    const rows = filteredStudents.map((student) => {
      const nameParts = (student.name || '').trim().split(/\s+/);
      const firstName = nameParts.shift() || '';
      const lastName = nameParts.join(' ');

      return [
        firstName,
        lastName,
        student.studentId || '',
        student.email || '',
        student.birthday ? new Date(student.birthday).toISOString().slice(0, 10) : '',
        student.gender || '',
        student.mobile || '',
        getSubjectNames(student.subjects),
        student.guardianTelephone || '',
        getGuardianName(student)
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
    link.download = `students-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="students-page">
      <Sidebar />
      <div className="students-main-content">
        <Topbar userName="Admin" />
        
        <div className="students-content">
          <div className="students-header">
            <h1>Students</h1>
            <div className="students-header-actions">
              <div className="students-search">
                <input
                  type="text"
                  placeholder="Search by name, ID, email, or subject"
                  value={searchTerm}
                  onChange={handleSearchChange}
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
                disabled={filteredStudents.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-student-btn" 
                onClick={() => {
                  if (showForm) {
                    handleCancelEdit();
                  } else {
                    setEditingStudent(null);
                    setShowForm(true);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Add New Student'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="student-form-container">
              <h2>{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
              <form onSubmit={handleSubmit} className="student-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender">Gender <span className="required">*</span></label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="birthday">Date of Birth <span className="required">*</span></label>
                    <input
                      type="date"
                      id="birthday"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="mobile">Primary Contact Number <span className="required">*</span></label>
                    <div className="mobile-input-wrapper">
                      <span className="mobile-prefix">+94</span>
                      <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleMobileChange}
                        placeholder="771234567"
                        required
                        maxLength="9"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="studentId">
                      Student Registration Number <span className="auto-generated">(System generated)</span>
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={editingStudent ? formData.studentId : 'Auto-generated'}
                      onChange={handleInputChange}
                      placeholder="Will be auto-generated"
                      disabled={!editingStudent}
                      readOnly={!editingStudent}
                      style={!editingStudent ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                    />
                  </div>

                  
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="guardianName">Guardian/Parent Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="guardianName"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                      placeholder="Enter guardian or parent name"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                    <label htmlFor="guardianTelephone">Guardian Telephone Number <span className="required">*</span></label>
                    <div className="mobile-input-wrapper">
                      <span className="mobile-prefix">+94</span>
                      <input
                        type="tel"
                        id="guardianTelephone"
                        name="guardianTelephone"
                        value={formData.guardianTelephone}
                        onChange={handleGuardianTelephoneChange}
                        placeholder="771234567"
                        required
                        maxLength="9"
                      />
                    </div>
                  </div>

                <div className="form-group">
                  <label>Enrolled Subjects <span className="required">*</span></label>
                  <div className="subjects-selection">
                    {subjects.length === 0 ? (
                      <p className="no-subjects">No subjects available</p>
                    ) : (
                      <div className="subjects-checkbox-list">
                        {subjects.map((subject) => {
                          const isSelected = formData.selectedSubjects.includes(subject._id);
                          const priceValue = formData.subjectPrices[subject._id];
                          // Display empty string if not set, otherwise show the value as string to preserve exact input
                          const displayPrice = priceValue === undefined || priceValue === '' ? '' : String(priceValue);
                          return (
                            <div key={subject._id} className="subject-item-with-price">
                              <label className="subject-checkbox-item">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSubjectToggle(subject._id)}
                                />
                                <span>{subject.name}</span>
                              </label>
                              {isSelected && (
                                <div className="subject-price-input">
                                  <label htmlFor={`price-${subject._id}`}>
                                    Price <span className="required">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    id={`price-${subject._id}`}
                                    value={displayPrice}
                                    onChange={(e) => handleSubjectPriceChange(subject._id, e.target.value)}
                                    placeholder="Enter price"
                                    required
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading 
                      ? (editingStudent ? 'Updating...' : 'Adding...') 
                      : (editingStudent ? 'Update Student' : 'Add Student')
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="students-table">
            {students.length === 0 ? (
              <div className="empty-state">
                <p>No students added yet. Click "Add New Student" to get started.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state">
                <p>No students match your search.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Student Registration No.</th>
                    <th>Email Address</th>
                    <th>Date of Birth</th>
                    <th>Gender</th>
                    <th>Primary Contact Number</th>
                    <th>Enrolled Subjects</th>
                    <th>Guardian Telephone Number</th>
                    <th>Guardian/Parent Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const nameParts = (student.name || '').trim().split(/\s+/);
                    const firstName = nameParts.shift() || '';
                    const lastName = nameParts.join(' ');
                    const guardian = getGuardianName(student);

                    return (
                      <tr key={student._id}>
                        <td>{firstName}</td>
                        <td>{lastName}</td>
                        <td>{student.studentId}</td>
                        <td>{student.email}</td>
                        <td>{formatDate(student.birthday)}</td>
                        <td>{student.gender}</td>
                        <td>{student.mobile}</td>
                        <td>{getSubjectsWithPrices(student)}</td>
                        <td>{student.guardianTelephone || student.guardianTeliphone || '-'}</td>
                        <td>{guardian}</td>
                        <td>
                          <button 
                            className="edit-btn"
                            onClick={() => handleEdit(student)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(student._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;

