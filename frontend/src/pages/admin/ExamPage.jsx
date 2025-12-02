import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import './ExamPage.css';

const ExamPage = () => {
  const [examRecords, setExamRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [validatedStudent, setValidatedStudent] = useState(null);
  const [validatingStudent, setValidatingStudent] = useState(false);
  const [studentValidationError, setStudentValidationError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ukVisa: '',
    exams: [],
    candidateIdNumber: '',
    examDate: ''
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate exam report (CSV) - will use filteredExams defined below
  const handleGenerateReport = () => {
    if (!examRecords || examRecords.length === 0) {
      alert('No exam records available to generate a report.');
      return;
    }

    // Filter exams for report (same logic as filteredExams)
    const examsToReport = examRecords.filter((exam) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const studentId = exam.studentIdNumber || (exam.studentId?.studentId || '');
      const studentName = exam.studentId?.name || '';
      return (
        studentId.toLowerCase().includes(term) ||
        studentName.toLowerCase().includes(term) ||
        (exam.ukVisa || '').toLowerCase().includes(term) ||
        (exam.exams && Array.isArray(exam.exams) && exam.exams.some(ex => {
          const subjectName = typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || '';
          return subjectName.toLowerCase().includes(term);
        })) ||
        (exam.exam || '').toLowerCase().includes(term) ||
        (exam.candidateIdNumber || '').toLowerCase().includes(term)
      );
    });

    if (examsToReport.length === 0) {
      alert('No exam records match your search criteria.');
      return;
    }

    // Create CSV content
    const headers = [
      'Student ID',
      'Student Name',
      'First Name',
      'Last Name',
      'Email',
      'UK Visa',
      'Exams',
      'Exam Date',
      'Candidate ID Number',
      'Created At'
    ];

    const rows = examsToReport.map((exam) => {
      // Format exams list
      let examsList = '';
      if (exam.exams && Array.isArray(exam.exams) && exam.exams.length > 0) {
        examsList = exam.exams.map((ex) => {
          const subjectName = typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || '';
          return subjectName;
        }).join('; ');
      } else if (exam.exam) {
        examsList = exam.exam;
      }

      return [
        exam.studentIdNumber || exam.studentId?.studentId || 'N/A',
        exam.studentId?.name || 'N/A',
        exam.firstName || 'N/A',
        exam.lastName || 'N/A',
        exam.studentId?.email || 'N/A',
        exam.ukVisa || 'N/A',
        examsList || 'N/A',
        exam.examDate ? (formatDate(exam.examDate) || 'N/A') : 'N/A',
        exam.candidateIdNumber || 'N/A',
        formatDate(exam.createdAt) || 'N/A'
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
    link.download = `exam-records-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Admin';

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/subjects');
      const data = await response.json();
      
      if (data.success && data.data) {
        const subjects = data.data.map(sub => ({
          id: sub._id,
          name: sub.name
        }));
        setAvailableSubjects(subjects);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setExamRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const validateStudentId = async () => {
    if (!studentIdInput.trim()) {
      setStudentValidationError('Please enter a Student ID');
      return;
    }

    setValidatingStudent(true);
    setStudentValidationError('');
    setValidatedStudent(null);

    try {
      const response = await fetch('https://lms-f679.onrender.com/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const student = data.data.find(s => s.studentId === studentIdInput.trim());
        if (student) {
          setValidatedStudent(student);
          setStudentValidationError('');
          setShowForm(true);
          // Pre-fill form with student data
          setFormData({
            firstName: '',
            lastName: '',
            ukVisa: '',
            exams: [],
            candidateIdNumber: '',
            examDate: ''
          });
        } else {
          setStudentValidationError('Student ID not found. Please enter a valid Student ID.');
          setValidatedStudent(null);
        }
      } else {
        setStudentValidationError('Error validating student ID');
      }
    } catch (err) {
      console.error('Error validating student:', err);
      setStudentValidationError('Network error. Please try again.');
    } finally {
      setValidatingStudent(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleExamSelect = (e) => {
    const selectedSubjectId = e.target.value;
    if (!selectedSubjectId) return;

    const selectedSubject = availableSubjects.find(sub => sub.id === selectedSubjectId);
    if (!selectedSubject) return;

    // Check if already selected
    const isAlreadySelected = formData.exams.some(exam => exam.subjectId === selectedSubjectId);
    if (isAlreadySelected) return;

    // Add to selected exams
    setFormData({
      ...formData,
      exams: [...formData.exams, {
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name
      }]
    });
    setError('');
    
    // Reset dropdown
    e.target.value = '';
  };

  const handleRemoveExam = (subjectId) => {
    setFormData({
      ...formData,
      exams: formData.exams.filter(exam => exam.subjectId !== subjectId)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!validatedStudent) {
      setError('Please validate student ID first');
      setLoading(false);
      return;
    }

    if (!formData.firstName.trim()) {
      setError('Please enter First Name');
      setLoading(false);
      return;
    }

    if (!formData.lastName.trim()) {
      setError('Please enter Last Name');
      setLoading(false);
      return;
    }

    if (!formData.exams || formData.exams.length === 0) {
      setError('Please select at least one exam subject');
      setLoading(false);
      return;
    }

    try {
      const url = editingExam
        ? `https://lms-f679.onrender.com/api/exams/${editingExam._id}`
        : 'https://lms-f679.onrender.com/api/exams';
      
      const method = editingExam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: validatedStudent._id,
          studentIdNumber: validatedStudent.studentId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          ukVisa: formData.ukVisa.trim() || undefined,
          exams: formData.exams.map(exam => ({
            subjectId: exam.subjectId,
            subjectName: exam.subjectName
          })),
          candidateIdNumber: formData.candidateIdNumber.trim() || undefined,
          examDate: formData.examDate || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(editingExam ? 'Exam record updated successfully!' : 'Exam record created successfully!');
        await fetchExams();
        handleReset();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || `Failed to ${editingExam ? 'update' : 'create'} exam record`);
      }
    } catch (err) {
      console.error('Error saving exam:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentIdInput('');
    setValidatedStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      ukVisa: '',
      exams: [],
      candidateIdNumber: '',
      examDate: ''
    });
    setShowForm(false);
    setEditingExam(null);
    setError('');
    setStudentValidationError('');
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setStudentIdInput(exam.studentIdNumber || (exam.studentId?.studentId || ''));
    setValidatedStudent(exam.studentId || null);
    
    // Format exam date for input field (YYYY-MM-DD format)
    let examDateFormatted = '';
    if (exam.examDate) {
      const date = new Date(exam.examDate);
      examDateFormatted = date.toISOString().split('T')[0];
    }
    
    // Handle both old format (exam) and new format (exams)
    let examsData = [];
    if (exam.exams && Array.isArray(exam.exams) && exam.exams.length > 0) {
      examsData = exam.exams.map(ex => ({
        subjectId: typeof ex.subjectId === 'object' ? ex.subjectId._id : ex.subjectId,
        subjectName: typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || ''
      }));
    } else if (exam.exam) {
      // Legacy format - convert to new format
      // Try to find subject by name
      const subject = availableSubjects.find(sub => sub.name === exam.exam);
      if (subject) {
        examsData = [{
          subjectId: subject.id,
          subjectName: subject.name
        }];
      }
    }
    
    setFormData({
      firstName: exam.firstName || '',
      lastName: exam.lastName || '',
      ukVisa: exam.ukVisa || '',
      exams: examsData,
      candidateIdNumber: exam.candidateIdNumber || '',
      examDate: examDateFormatted
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam record?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Exam record deleted successfully!');
        await fetchExams();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete exam record');
      }
    } catch (err) {
      console.error('Error deleting exam:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredExams = examRecords.filter((exam) => {
    const term = searchTerm.toLowerCase();
    const studentId = exam.studentIdNumber || (exam.studentId?.studentId || '');
    const studentName = exam.studentId?.name || '';
    return (
      studentId.toLowerCase().includes(term) ||
      studentName.toLowerCase().includes(term) ||
      (exam.ukVisa || '').toLowerCase().includes(term) ||
      (exam.exams && Array.isArray(exam.exams) && exam.exams.some(ex => {
        const subjectName = typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || '';
        return subjectName.toLowerCase().includes(term);
      })) ||
      (exam.exam || '').toLowerCase().includes(term) ||
      (exam.candidateIdNumber || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="exam-page">
      <Sidebar />
      <div className="exam-main-content">
        <Topbar userName={userName} />
        
        <div className="exam-content">
          <div className="exam-header">
            <h1>Exam Registration</h1>
            <div className="exam-header-actions">
              <div className="exam-search">
                <input
                  type="text"
                  placeholder="Search by student ID, name, or candidate ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={!examRecords || examRecords.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-exam-btn" 
                onClick={() => {
                  if (showForm) {
                    handleReset();
                  } else {
                    setShowForm(true);
                    setEditingExam(null);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Add Exam'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="exam-form-container">
              <h2>{editingExam ? 'Edit Exam Record' : 'Add New Exam Record'}</h2>
              <form onSubmit={handleSubmit} className="exam-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <label htmlFor="studentIdInput">Student ID <span className="required">*</span></label>
                  <div className="student-id-validation">
                     <input
                       type="text"
                       id="studentIdInput"
                       value={studentIdInput}
                       onChange={(e) => {
                         setStudentIdInput(e.target.value);
                         setStudentValidationError('');
                         if (validatedStudent) {
                           setValidatedStudent(null);
                         }
                       }}
                       placeholder="Enter student ID"
                       disabled={!!validatedStudent}
                       required
                     />
                    {!validatedStudent && (
                      <button
                        type="button"
                        className="validate-btn"
                        onClick={validateStudentId}
                        disabled={validatingStudent || !studentIdInput.trim()}
                      >
                        {validatingStudent ? 'Validating...' : 'Validate'}
                      </button>
                    )}
                    {validatedStudent && (
                      <button
                        type="button"
                        className="change-student-btn"
                        onClick={() => {
                          setValidatedStudent(null);
                          setStudentIdInput('');
                          setShowForm(false);
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                  {studentValidationError && (
                    <div className="error-message">{studentValidationError}</div>
                  )}
                </div>

                {validatedStudent && (
                  <>
                    <div className="student-details-section">
                      <h3>Student Information</h3>
                      <div className="student-details-grid">
                        <div className="detail-item">
                          <label>Name:</label>
                          <span>{validatedStudent.name}</span>
                        </div>
                        <div className="detail-item">
                          <label>Student ID:</label>
                          <span>{validatedStudent.studentId}</span>
                        </div>
                        <div className="detail-item">
                          <label>Email:</label>
                          <span>{validatedStudent.email}</span>
                        </div>
                        <div className="detail-item">
                          <label>Birthday:</label>
                          <span>{formatDate(validatedStudent.birthday)}</span>
                        </div>
                        <div className="detail-item">
                          <label>Gender:</label>
                          <span>{validatedStudent.gender}</span>
                        </div>
                        <div className="detail-item">
                          <label>Mobile:</label>
                          <span>{validatedStudent.mobile}</span>
                        </div>
                        {validatedStudent.hasSpecialNeeds && (
                          <>
                            <div className="detail-item">
                              <label>Special Need:</label>
                              <span>{validatedStudent.specialNeed || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Special Needs Details:</label>
                              <span>{validatedStudent.specialNeedsDetails || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Guardian First Name:</label>
                              <span>{validatedStudent.guardianFirstName || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Guardian Last Name:</label>
                              <span>{validatedStudent.guardianLastName || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <label>Guardian Telephone:</label>
                              <span>{validatedStudent.guardianTelephone || '-'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

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

                    <div className="form-group">
                      <label htmlFor="examSelect">Select Exam Subjects <span className="required">*</span></label>
                      <select
                        id="examSelect"
                        onChange={handleExamSelect}
                        value=""
                        disabled={loadingSubjects}
                      >
                        <option value="" disabled>Select a subject</option>
                        {availableSubjects
                          .filter(sub => !formData.exams.some(exam => exam.subjectId === sub.id))
                          .map(subject => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                      </select>
                      {formData.exams.length > 0 && (
                        <div className="selected-exams-list">
                          {formData.exams.map((exam, index) => (
                            <div key={index} className="selected-exam-item">
                              <span>{exam.subjectName}</span>
                              <button
                                type="button"
                                className="remove-exam-btn"
                                onClick={() => handleRemoveExam(exam.subjectId)}
                                title="Remove this exam"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="examDate">Exam Date</label>
                      <input
                        type="date"
                        id="examDate"
                        name="examDate"
                        value={formData.examDate}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* <div className="form-group">
                      <label htmlFor="ukVisa">UK Visa</label>
                      <input
                        type="text"
                        id="ukVisa"
                        name="ukVisa"
                        value={formData.ukVisa}
                        onChange={handleInputChange}
                        placeholder="Enter UK Visa (Optional)"
                      />
                    </div> */}

                    

                    {/* <div className="form-group">
                      <label htmlFor="candidateIdNumber">Candidate ID Number</label>
                      <input
                        type="text"
                        id="candidateIdNumber"
                        name="candidateIdNumber"
                        value={formData.candidateIdNumber}
                        onChange={handleInputChange}
                        placeholder="Enter Candidate ID Number (Optional)"
                      />
                    </div> */}

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={handleReset}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading 
                          ? (editingExam ? 'Updating...' : 'Saving...') 
                          : (editingExam ? 'Update Exam' : 'Save Exam')
                        }
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          <div className="exam-records-section">
            <h2>Exam Records</h2>
            {examRecords.length === 0 ? (
              <div className="empty-state">
                <p>No exam records found. Click "Add New Exam" to create one.</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="empty-state">
                <p>No exam records match your search.</p>
              </div>
            ) : (
              <div className="exam-table-container">
                <table className="exam-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Email</th>
                      <th>UK Visa</th>
                      <th>Exams</th>
                      <th>Exam Date</th>
                      <th>Candidate ID Number</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => (
                      <tr key={exam._id}>
                        <td>{exam.studentIdNumber || (exam.studentId?.studentId || '-')}</td>
                        <td>{exam.studentId?.name || '-'}</td>
                        <td>{exam.firstName || '-'}</td>
                        <td>{exam.lastName || '-'}</td>
                        <td>{exam.studentId?.email || '-'}</td>
                        <td>{exam.ukVisa || '-'}</td>
                        <td>
                          {exam.exams && Array.isArray(exam.exams) && exam.exams.length > 0 ? (
                            <div className="exams-list">
                              {exam.exams.map((ex, idx) => {
                                const subjectName = typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || '';
                                return (
                                  <span key={idx} className="exam-badge">
                                    {subjectName}
                                  </span>
                                );
                              })}
                            </div>
                          ) : exam.exam ? (
                            <span className="exam-badge">{exam.exam}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>{exam.examDate ? formatDate(exam.examDate) : '-'}</td>
                        <td>{exam.candidateIdNumber || '-'}</td>
                        <td>{formatDate(exam.createdAt)}</td>
                        <td>
                          <div className="exam-actions">
                            <button
                              className="edit-btn"
                              onClick={() => handleEdit(exam)}
                              title="Edit Exam"
                            >
                              Edit
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(exam._id)}
                              title="Delete Exam"
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
        </div>
      </div>
    </div>
  );
};

export default ExamPage;

