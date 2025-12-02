import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import './StudentsPage.css';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    birthday: '',
    gender: '',
    mobile: '',
    selectedSubjects: [],
    subjectPrices: {}, // Object mapping subjectId to price
    hasSpecialNeeds: false,
    specialNeed: '',
    specialNeedsDetails: '',
    guardianFirstName: '',
    guardianLastName: '',
    guardianTelephone: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);


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
      
      // Remove price when unselecting, add empty price when selecting
      const newSubjectPrices = { ...prev.subjectPrices };
      if (isSelected) {
        delete newSubjectPrices[subjectId];
      } else {
        newSubjectPrices[subjectId] = '';
      }
      
      return {
        ...prev,
        selectedSubjects: newSelectedSubjects,
        subjectPrices: newSubjectPrices
      };
    });
  };

  const handleSubjectPriceChange = (subjectId, price) => {
    // Store price as string to preserve exact user input (no rounding)
    setFormData(prev => ({
      ...prev,
      subjectPrices: {
        ...prev.subjectPrices,
        [subjectId]: price
      }
    }));
    setError('');
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    
    // Format birthday for date input (YYYY-MM-DD)
    const birthdayDate = student.birthday ? new Date(student.birthday).toISOString().split('T')[0] : '';
    
    // Extract subject IDs (handle both populated objects and IDs)
    const subjectIds = student.subjects?.map(subject => {
      return typeof subject === 'object' ? subject._id : subject;
    }) || [];
    
    // Build subjectPrices object from existing student data
    // If student has subjectPrices array, use it; otherwise create from subjects and totalPrice
    const subjectPricesObj = {};
    if (student.subjectPrices && Array.isArray(student.subjectPrices)) {
      student.subjectPrices.forEach(sp => {
        const subjectId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
        // Preserve exact price value as string to avoid rounding issues
        subjectPricesObj[subjectId] = sp.price !== undefined && sp.price !== null ? String(sp.price) : '';
      });
    } else if (subjectIds.length > 0 && student.totalPrice) {
      // Fallback: distribute totalPrice evenly if no subjectPrices exist
      // Don't use toFixed here - let user enter their own prices
      subjectIds.forEach(id => {
        subjectPricesObj[id] = '';
      });
    } else {
      // Initialize empty prices for selected subjects
      subjectIds.forEach(id => {
        subjectPricesObj[id] = '';
      });
    }
    
    setFormData({
      name: student.name || '',
      studentId: student.studentId || '',
      email: student.email || '',
      birthday: birthdayDate,
      gender: student.gender || '',
      mobile: (() => {
        // Format mobile number for display (remove +94 prefix if present, remove leading 0)
        let mobile = student.mobile || '';
        if (mobile) {
          // Remove +94 prefix if present
          if (mobile.startsWith('+94')) {
            mobile = mobile.substring(3);
          }
          // Remove leading 0 if present
          if (mobile.startsWith('0')) {
            mobile = mobile.substring(1);
          }
          // Remove any non-digit characters
          mobile = mobile.replace(/\D/g, '');
        }
        return mobile;
      })(),
      selectedSubjects: subjectIds,
      subjectPrices: subjectPricesObj,
      hasSpecialNeeds: student.hasSpecialNeeds || false,
      specialNeed: student.specialNeed || '',
      specialNeedsDetails: student.specialNeedsDetails || '',
      guardianFirstName: student.guardianFirstName || '',
      guardianLastName: student.guardianLastName || '',
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
      })()
    });
    
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      studentId: '',
      email: '',
      birthday: '',
      gender: '',
      mobile: '',
      selectedSubjects: [],
      subjectPrices: {},
      hasSpecialNeeds: false,
      specialNeed: '',
      specialNeedsDetails: '',
      guardianFirstName: '',
      guardianLastName: '',
      guardianTelephone: ''
    });
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Trim and validate required fields
    const trimmedName = (formData.name || '').trim();
    const trimmedStudentId = (formData.studentId || '').trim();
    const trimmedEmail = (formData.email || '').trim();
    
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

    // Validate required fields with specific error messages
    if (!trimmedName) {
      setError('Please enter student name');
      setLoading(false);
      return;
    }
    // Student ID is now auto-generated, so no validation needed
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
    // Validate that all selected subjects have prices
    for (const subjectId of formData.selectedSubjects) {
      const price = formData.subjectPrices[subjectId];
      if (!price || Number(price) <= 0) {
        const subject = subjects.find(s => s._id === subjectId);
        setError(`Please enter a valid price for ${subject?.name || 'selected subject'}`);
        setLoading(false);
        return;
      }
    }

    try {
      const url = editingStudent 
        ? `https://lms-f679.onrender.com/api/students/${editingStudent._id}`
        : 'https://lms-f679.onrender.com/api/students';
      
      const method = editingStudent ? 'PUT' : 'POST';

      // Build subjectPrices array from formData
      // Convert to numbers only when sending to backend, preserving exact values
      const subjectPrices = formData.selectedSubjects.map(subjectId => {
        const priceStr = formData.subjectPrices[subjectId] || '0';
        // Parse as float to preserve decimal precision
        const price = parseFloat(priceStr) || 0;
        return {
          subjectId: subjectId,
          price: price
        };
      });
      
      // Calculate total price from subject prices
      const totalPrice = subjectPrices.reduce((sum, sp) => sum + sp.price, 0);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: trimmedName,
          studentId: editingStudent ? trimmedStudentId : '', // Empty string for new students to trigger auto-generation
          email: trimmedEmail,
          birthday: formData.birthday,
          gender: formData.gender,
          mobile: trimmedMobile,
          subjects: formData.selectedSubjects,
          subjectPrices: subjectPrices,
          totalPrice: totalPrice,
          hasSpecialNeeds: formData.hasSpecialNeeds,
          specialNeed: formData.hasSpecialNeeds ? (formData.specialNeed || '').trim() : undefined,
          specialNeedsDetails: formData.hasSpecialNeeds ? (formData.specialNeedsDetails || '').trim() : undefined,
          guardianFirstName: formData.hasSpecialNeeds ? (formData.guardianFirstName || '').trim() : undefined,
          guardianLastName: formData.hasSpecialNeeds ? (formData.guardianLastName || '').trim() : undefined,
          guardianTelephone: formData.hasSpecialNeeds ? trimmedGuardianTelephone : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchStudents();
        setFormData({
          name: '',
          studentId: '',
          email: '',
          birthday: '',
          gender: '',
          mobile: '',
          selectedSubjects: [],
          subjectPrices: {},
          hasSpecialNeeds: false,
          specialNeedsDetails: '',
          guardianFirstName: '',
          guardianLastName: '',
          guardianTelephone: ''
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
      const response = await fetch(`https://lms-f679.onrender.com/api/students/${id}`, {
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
    if (!student.subjects || student.subjects.length === 0) return 'None';
    
    // If student has subjectPrices, use them
    if (student.subjectPrices && Array.isArray(student.subjectPrices) && student.subjectPrices.length > 0) {
      return student.subjectPrices.map(sp => {
        const subjectId = typeof sp.subjectId === 'object' ? sp.subjectId._id : sp.subjectId;
        const subject = student.subjects.find(s => {
          const sId = typeof s === 'object' ? s._id : s;
          return sId === subjectId;
        });
        const subjectName = typeof subject === 'object' && subject.name 
          ? subject.name 
          : subjects.find(s => s._id === subjectId)?.name || 'Unknown';
        return `${subjectName} (LKR ${(sp.price || 0).toFixed(2)})`;
      }).join(', ');
    }
    
    // Fallback to just subject names
    return getSubjectNames(student.subjects);
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
      'Name',
      'Student ID',
      'Email',
      'Birthday',
      'Gender',
      'Mobile',
      'Subjects',
      'Total Price (LKR)',
      'Special Needs',
      'Guardian First Name',
      'Guardian Last Name',
      'Guardian Telephone'
    ];

    const rows = filteredStudents.map((student) => [
      student.name || '',
      student.studentId || '',
      student.email || '',
      student.birthday ? new Date(student.birthday).toISOString().slice(0, 10) : '',
      student.gender || '',
      student.mobile || '',
      getSubjectNames(student.subjects),
      student.totalPrice !== undefined && student.totalPrice !== null
        ? student.totalPrice
        : 0,
      student.hasSpecialNeeds ? 'Yes' : 'No',
      student.guardianFirstName || '',
      student.guardianLastName || '',
      student.guardianTelephone || ''
    ]);

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
                    <label htmlFor="name">Student Name <span className="required">*</span></label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter student name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="studentId">
                      Student ID {editingStudent ? <span className="required">*</span> : <span className="auto-generated">(Auto-generated)</span>}
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={editingStudent ? formData.studentId : 'Auto-generated (ID####)'}
                      onChange={handleInputChange}
                      placeholder={editingStudent ? "Enter student ID" : "Will be auto-generated"}
                      required={editingStudent}
                      disabled={!editingStudent}
                      readOnly={!editingStudent}
                      style={!editingStudent ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email <span className="required">*</span></label>
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

                  <div className="form-group">
                    <label htmlFor="birthday">Birthday <span className="required">*</span></label>
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
                    <label htmlFor="mobile">Mobile <span className="required">*</span></label>
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
                </div>

                <div className="form-group">
                  <label>Subjects <span className="required">*</span></label>
                  <div className="subjects-selection">
                    {subjects.length === 0 ? (
                      <p className="no-subjects">No subjects available</p>
                    ) : (
                      <div className="subjects-checkbox-list">
                        {subjects.map((subject) => {
                          const isSelected = formData.selectedSubjects.includes(subject._id);
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
                                  <label htmlFor={`price-${subject._id}`}>Price (LKR) <span className="required">*</span></label>
                                  <input
                                    type="number"
                                    id={`price-${subject._id}`}
                                    value={formData.subjectPrices[subject._id] || ''}
                                    onChange={(e) => handleSubjectPriceChange(subject._id, e.target.value)}
                                    placeholder="Enter price"
                                    min="0"
                                    step="any"
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
                  {formData.selectedSubjects.length > 0 && (
                    <div className="total-price-display">
                      <strong>Total Price: LKR {
                        formData.selectedSubjects.reduce((sum, subjectId) => {
                          const price = Number(formData.subjectPrices[subjectId] || 0);
                          return sum + price;
                        }, 0).toFixed(2)
                      }</strong>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="hasSpecialNeeds"
                      checked={formData.hasSpecialNeeds}
                      onChange={handleInputChange}
                    />
                    <span>Has Special Needs</span>
                  </label>
                </div>

                {formData.hasSpecialNeeds && (
                  <>
                    <div className="form-group">
                      <label htmlFor="specialNeed">Special Need</label>
                      <input
                        type="text"
                        id="specialNeed"
                        name="specialNeed"
                        value={formData.specialNeed}
                        onChange={handleInputChange}
                        placeholder="Enter special need (e.g., Autism, ADHD, etc.)"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="specialNeedsDetails">Special Needs Details</label>
                      <textarea
                        id="specialNeedsDetails"
                        name="specialNeedsDetails"
                        value={formData.specialNeedsDetails}
                        onChange={handleInputChange}
                        placeholder="Enter special needs details"
                        rows="3"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="guardianFirstName">Guardian First Name </label>
                        <input
                          type="text"
                          id="guardianFirstName"
                          name="guardianFirstName"
                          value={formData.guardianFirstName}
                          onChange={handleInputChange}
                          placeholder="Enter guardian first name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="guardianLastName">Guardian Last Name </label>
                        <input
                          type="text"
                          id="guardianLastName"
                          name="guardianLastName"
                          value={formData.guardianLastName}
                          onChange={handleInputChange}
                          placeholder="Enter guardian last name"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="guardianTelephone">Guardian Telephone </label>
                      <div className="mobile-input-wrapper">
                        <span className="mobile-prefix">+94</span>
                      <input
                        type="tel"
                        id="guardianTelephone"
                        name="guardianTelephone"
                        value={formData.guardianTelephone}
                          onChange={handleGuardianTelephoneChange}
                          placeholder="771234567"
                          maxLength={9}
                      />
                      </div>
                    </div>
                  </>
                )}

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
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Email</th>
                    <th>Birthday</th>
                    <th>Gender</th>
                    <th>Mobile</th>
                    <th>Subjects</th>
                    <th>Total Price</th>
                    <th>Special Needs</th>
                    <th>Guardian First Name</th>
                    <th>Guardian Last Name</th>
                    <th>Guardian Telephone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td>{student.name}</td>
                      <td>{student.studentId}</td>
                      <td>{student.email}</td>
                      <td>{formatDate(student.birthday)}</td>
                      <td>{student.gender}</td>
                      <td>{student.mobile}</td>
                    <td>{getSubjectsWithPrices(student)}</td>
                    <td>LKR {student.totalPrice?.toFixed(2) || '0.00'}</td>
                      <td>{student.hasSpecialNeeds ? 'Yes' : 'No'}</td>
                      <td>{student.hasSpecialNeeds && student.guardianFirstName ? student.guardianFirstName : '-'}</td>
                      <td>{student.hasSpecialNeeds && student.guardianLastName ? student.guardianLastName : '-'}</td>
                      <td>{student.hasSpecialNeeds && student.guardianTelephone ? student.guardianTelephone : '-'}</td>
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
                  ))}
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

