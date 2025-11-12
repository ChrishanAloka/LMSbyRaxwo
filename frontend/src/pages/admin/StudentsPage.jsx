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
    hasSpecialNeeds: false,
    specialNeedsDetails: '',
    guardianName: '',
    guardianTelephone: '',
    paymentType: ''
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Calculate price when selected subjects change
    if (formData.selectedSubjects.length > 0) {
      const totalPrice = formData.selectedSubjects.reduce((sum, subjectId) => {
        const subject = subjects.find(s => s._id === subjectId);
        return sum + (subject ? subject.price : 0);
      }, 0);
      setCalculatedPrice(totalPrice);
    } else {
      setCalculatedPrice(0);
    }
  }, [formData.selectedSubjects, subjects]);

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

  const handleEdit = (student) => {
    setEditingStudent(student);
    
    // Format birthday for date input (YYYY-MM-DD)
    const birthdayDate = student.birthday ? new Date(student.birthday).toISOString().split('T')[0] : '';
    
    // Extract subject IDs (handle both populated objects and IDs)
    const subjectIds = student.subjects?.map(subject => {
      return typeof subject === 'object' ? subject._id : subject;
    }) || [];
    
    setFormData({
      name: student.name || '',
      studentId: student.studentId || '',
      email: student.email || '',
      birthday: birthdayDate,
      gender: student.gender || '',
      mobile: student.mobile || '',
      selectedSubjects: subjectIds,
      hasSpecialNeeds: student.hasSpecialNeeds || false,
      specialNeedsDetails: student.specialNeedsDetails || '',
      guardianName: student.guardianName || '',
      guardianTelephone: student.guardianTelephone || '',
      paymentType: student.paymentType || ''
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
      hasSpecialNeeds: false,
      specialNeedsDetails: '',
      guardianName: '',
      guardianTelephone: '',
      paymentType: ''
    });
    setCalculatedPrice(0);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.studentId || !formData.email || 
        !formData.birthday || !formData.gender || !formData.mobile || !formData.paymentType) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    try {
      const url = editingStudent 
        ? `https://lms-f679.onrender.com/api/students/${editingStudent._id}`
        : 'https://lms-f679.onrender.com/api/students';
      
      const method = editingStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          studentId: formData.studentId,
          email: formData.email,
          birthday: formData.birthday,
          gender: formData.gender,
          mobile: formData.mobile,
          subjects: formData.selectedSubjects,
          hasSpecialNeeds: formData.hasSpecialNeeds,
          specialNeedsDetails: formData.hasSpecialNeeds ? formData.specialNeedsDetails : undefined,
          guardianName: formData.hasSpecialNeeds ? formData.guardianName : undefined,
          guardianTelephone: formData.hasSpecialNeeds ? formData.guardianTelephone : undefined,
          paymentType: formData.paymentType
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
          hasSpecialNeeds: false,
          specialNeedsDetails: '',
          guardianName: '',
          guardianTelephone: '',
          paymentType: ''
        });
        setCalculatedPrice(0);
        setEditingStudent(null);
        setShowForm(false);
      } else {
        setError(data.message || `Failed to ${editingStudent ? 'update' : 'add'} student`);
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
        student.paymentType,
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
      'Payment Type',
      'Special Needs',
      'Guardian Name',
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
      student.paymentType || '',
      student.hasSpecialNeeds ? 'Yes' : 'No',
      student.guardianName || '',
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
                    <label htmlFor="studentId">Student ID <span className="required">*</span></label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      placeholder="Enter student ID"
                      required
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
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mobile">Mobile <span className="required">*</span></label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Subjects</label>
                  <div className="subjects-selection">
                    {subjects.length === 0 ? (
                      <p className="no-subjects">No subjects available</p>
                    ) : (
                      <div className="subjects-checkbox-list">
                        {subjects.map((subject) => (
                          <label key={subject._id} className="subject-checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.selectedSubjects.includes(subject._id)}
                              onChange={() => handleSubjectToggle(subject._id)}
                            />
                            <span>{subject.name} - LKR {subject.price}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {calculatedPrice > 0 && (
                    <div className="price-display">
                      <strong>Total Price: LKR {calculatedPrice.toFixed(2)}</strong>
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
                        <label htmlFor="guardianName">Guardian Name </label>
                        <input
                          type="text"
                          id="guardianName"
                          name="guardianName"
                          value={formData.guardianName}
                          onChange={handleInputChange}
                          placeholder="Enter guardian name"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="guardianTelephone">Guardian Telephone </label>
                        <input
                          type="tel"
                          id="guardianTelephone"
                          name="guardianTelephone"
                          value={formData.guardianTelephone}
                          onChange={handleInputChange}
                          placeholder="Enter guardian telephone"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="paymentType">Payment Type <span className="required">*</span></label>
                  <select
                    id="paymentType"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select Payment Type</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
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
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Email</th>
                    <th>Birthday</th>
                    <th>Gender</th>
                    <th>Mobile</th>
                    <th>Subjects</th>
                    <th>Total Price</th>
                    <th>Payment Type</th>
                    <th>Special Needs</th>
                    <th>Guardian</th>
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
                      <td>{getSubjectNames(student.subjects)}</td>
                      <td>LKR {student.totalPrice?.toFixed(2) || '0.00'}</td>
                      <td><span className={`payment-badge ${student.paymentType}`}>{student.paymentType}</span></td>
                      <td>{student.hasSpecialNeeds ? 'Yes' : 'No'}</td>
                      <td>
                        {student.hasSpecialNeeds && student.guardianName ? (
                          <div>
                            <div>{student.guardianName}</div>
                            {student.guardianTelephone && (
                              <div className="guardian-phone">{student.guardianTelephone}</div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
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

