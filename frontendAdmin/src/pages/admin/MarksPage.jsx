import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import './MarksPage.css';

const MarksPage = () => {
  const [marksRecords, setMarksRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [validatedStudent, setValidatedStudent] = useState(null);
  const [validatingStudent, setValidatingStudent] = useState(false);
  const [studentValidationError, setStudentValidationError] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [editingMarks, setEditingMarks] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchMarks();
    fetchSubjects();
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Use subjects from database
        const subjects = data.data.map(sub => ({
          id: sub._id,
          name: sub.name
        }));
        setAvailableSubjects(subjects);
      } else {
        // If no subjects exist, use test subjects as fallback
        // Backend will create them when marks are submitted
        const testSubjects = [
          { id: 'test1', name: 'test1' },
          { id: 'test2', name: 'test2' }
        ];
        setAvailableSubjects(testSubjects);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      // Fallback: use test subjects (backend will create them)
      const testSubjects = [
        { id: 'test1', name: 'test1' },
        { id: 'test2', name: 'test2' }
      ];
      setAvailableSubjects(testSubjects);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchMarks = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMarksRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
    }
  };

  // Get student suggestions based on search input
  const getStudentSuggestions = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const suggestions = [];

    allStudents.forEach(student => {
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
    setStudentIdInput(searchTerm);
    
    if (searchTerm.trim()) {
      const suggestions = getStudentSuggestions(searchTerm);
      setStudentSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }

    setValidatedStudent(null);
    setStudentValidationError('');
    setSubjectMarks([]);
  };

  const handleStudentSuggestionSelect = async (student) => {
    setStudentIdInput(`${student.name} (ID: ${student.studentId})`);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    
    // Validate the selected student through the backend
    setValidatingStudent(true);
    setStudentValidationError('');
    
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks/validate-student/${student.studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.valid) {
        setValidatedStudent(data.data);
        setSubjectMarks([{
          subjectId: '',
          subjectName: '',
          marks: '',
          grade: ''
        }]);
        setStudentValidationError('');
      } else {
        setStudentValidationError(data.message || 'Invalid Student ID. Student not found.');
        setValidatedStudent(null);
        setSubjectMarks([]);
      }
    } catch (err) {
      setStudentValidationError('Network error. Please try again.');
      setValidatedStudent(null);
      setSubjectMarks([]);
    } finally {
      setValidatingStudent(false);
    }
  };

  const validateStudentId = async () => {
    if (!studentIdInput.trim()) {
      setStudentValidationError('Please enter a Student ID, first name, last name, or full name');
      return;
    }

    // If student is already selected from suggestions, skip validation
    if (validatedStudent) {
      return;
    }

    setValidatingStudent(true);
    setStudentValidationError('');
    setValidatedStudent(null);
    setSubjectMarks([]);

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks/validate-student/${studentIdInput.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.valid) {
        setValidatedStudent(data.data);
        // Initialize with one empty subject entry
        setSubjectMarks([{
          subjectId: '',
          subjectName: '',
          marks: '',
          grade: ''
        }]);
        setStudentValidationError('');
      } else {
        setStudentValidationError(data.message || 'Invalid Student ID. Student not found.');
        setValidatedStudent(null);
        setSubjectMarks([]);
      }
    } catch (err) {
      setStudentValidationError('Network error. Please try again.');
      setValidatedStudent(null);
      setSubjectMarks([]);
    } finally {
      setValidatingStudent(false);
    }
  };

  const handleSubjectMarksChange = (index, field, value) => {
    const updatedMarks = [...subjectMarks];
    updatedMarks[index][field] = value;
    
    // If subject is changed, update subjectName as well
    if (field === 'subjectId') {
      const selectedSubject = availableSubjects.find(sub => sub.id === value);
      updatedMarks[index].subjectName = selectedSubject ? selectedSubject.name : '';
    }
    
    setSubjectMarks(updatedMarks);
  };

  const handleAddSubject = () => {
    setSubjectMarks([...subjectMarks, {
      subjectId: '',
      subjectName: '',
      marks: '',
      grade: ''
    }]);
  };

  const handleRemoveSubject = (index) => {
    if (subjectMarks.length > 1) {
      const updatedMarks = subjectMarks.filter((_, i) => i !== index);
      setSubjectMarks(updatedMarks);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all subjects have subject selected, marks and grade
    const incompleteSubjects = subjectMarks.filter(sub => !sub.subjectId || !sub.marks || !sub.grade);
    if (incompleteSubjects.length > 0) {
      setError('Please select subject, enter marks and grade for all entries');
      setLoading(false);
      return;
    }

    // Validate no duplicate subjects
    const subjectIds = subjectMarks.map(sub => sub.subjectId);
    const duplicateSubjects = subjectIds.filter((id, index) => subjectIds.indexOf(id) !== index);
    if (duplicateSubjects.length > 0) {
      setError('Each subject can only be added once. Please remove duplicate subjects.');
      setLoading(false);
      return;
    }

    // Validate marks range (0-100)
    const invalidMarks = subjectMarks.filter(sub => {
      const marks = parseFloat(sub.marks);
      return isNaN(marks) || marks < 0 || marks > 100;
    });
    if (invalidMarks.length > 0) {
      setError('Marks must be between 0 and 100');
      setLoading(false);
      return;
    }

    try {
      const subjectsData = subjectMarks.map(sub => ({
        subjectId: sub.subjectId,
        marks: parseFloat(sub.marks),
        grade: sub.grade.trim()
      }));

      const url = editingMarks 
        ? `${API_CONFIG.API_URL}/marks/${editingMarks._id}`
        : `${API_CONFIG.API_URL}/marks`;
      
      const method = editingMarks ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: validatedStudent.studentId,
          subjects: subjectsData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchMarks();
        resetForm();
        setShowForm(false);
      } else {
        setError(data.message || `Failed to ${editingMarks ? 'update' : 'add'} marks`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (marksRecord) => {
    setViewingRecord(null);
    setEditingMarks(marksRecord);
    setStudentIdInput(marksRecord.studentId?.studentId || '');
    setValidatedStudent({
      studentId: marksRecord.studentId._id,
      name: marksRecord.studentId.name,
      studentIdField: marksRecord.studentId.studentId,
      subjects: marksRecord.subjects.map(sub => sub.subjectId)
    });

    // Initialize subject marks from existing record
    const initialMarks = marksRecord.subjects.map(sub => {
      const subjectId = typeof sub.subjectId === 'object' ? sub.subjectId._id : sub.subjectId;
      const subjectName = typeof sub.subjectId === 'object' ? sub.subjectId.name : '';
      // If subject is not in availableSubjects, use the subjectId as fallback
      const foundSubject = availableSubjects.find(s => s.id === subjectId || s.name === subjectName);
      return {
        subjectId: foundSubject ? foundSubject.id : subjectId,
        subjectName: foundSubject ? foundSubject.name : subjectName,
        marks: sub.marks.toString(),
        grade: sub.grade
      };
    });
    setSubjectMarks(initialMarks);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marks record?')) return;

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/marks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchMarks();
      } else {
        alert(data.message || 'Failed to delete marks');
      }
    } catch (err) {
      console.error('Error deleting marks:', err);
      alert('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setStudentIdInput('');
    setValidatedStudent(null);
    setSubjectMarks([]);
    setEditingMarks(null);
    setStudentValidationError('');
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredMarks = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return marksRecords;
    }

    return marksRecords.filter((record) => {
      const studentName = record.studentId?.name || '';
      const studentId = record.studentId?.studentId || '';
      const subjects = record.subjects || [];
      const subjectNames = subjects
        .map((subject) => (typeof subject.subjectId === 'object' ? subject.subjectId.name : ''))
        .join(' ');
      return [studentName, studentId, subjectNames]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [marksRecords, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredMarks.length) {
      alert('No marks records available to generate a report.');
      return;
    }

    const headers = ['Student ID', 'Student Name', 'Subject', 'Marks', 'Grade'];

    const rows = filteredMarks.flatMap((record) => {
      const studentName = record.studentId?.name || '';
      const studentId = record.studentId?.studentId || '';

      if (!record.subjects || record.subjects.length === 0) {
        return [[studentId, studentName, '', '', '']];
      }

      return record.subjects.map((subjectEntry) => {
        const subject =
          typeof subjectEntry.subjectId === 'object' ? subjectEntry.subjectId : null;
        return [
          studentId,
          studentName,
          subject?.name || 'Unknown Subject',
          subjectEntry.marks ?? '',
          subjectEntry.grade ?? ''
        ];
      });
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
    link.download = `marks-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="marks-page">
      <Sidebar />
      <div className="marks-main-content">
        <Topbar userName="Admin" />
        
        <div className="marks-content">
          <div className="marks-header">
            <h1>Marks Management</h1>
            <div className="marks-header-actions">
              <div className="marks-search">
                <input
                  type="text"
                  placeholder="Search by student or subject"
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
                disabled={filteredMarks.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-marks-btn" 
                onClick={() => {
                  if (showForm) {
                    handleCancel();
                  } else {
                    setShowForm(true);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Add Marks'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="marks-form-container">
              <h2>{editingMarks ? 'Edit Marks' : 'Add Marks'}</h2>
              <form onSubmit={handleSubmit} className="marks-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label htmlFor="studentId">Student ID or Name <span className="required">*</span></label>
                  <div className="student-id-input-group">
                    <div className="student-search-container" style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        id="studentId"
                        value={studentIdInput}
                        onChange={handleStudentSearchChange}
                        onFocus={() => {
                          if (studentIdInput && !editingMarks) {
                            const suggestions = getStudentSuggestions(studentIdInput);
                            setStudentSuggestions(suggestions);
                            setShowSuggestions(suggestions.length > 0);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="Type Student ID, first name, last name, or full name..."
                        disabled={!!editingMarks}
                        required
                        autoComplete="off"
                        style={{ width: '100%' }}
                      />
                      {showSuggestions && studentSuggestions.length > 0 && !editingMarks && (
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
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          marginTop: '2px'
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
                    {!editingMarks && (
                      <button
                        type="button"
                        className="validate-btn"
                        onClick={validateStudentId}
                        disabled={validatingStudent || !studentIdInput.trim()}
                      >
                        {validatingStudent ? 'Validating...' : 'Validate'}
                      </button>
                    )}
                  </div>
                  {studentValidationError && (
                    <div className="validation-error">{studentValidationError}</div>
                  )}
                  {validatedStudent && (
                    <div className="validation-success">
                      ✓ Valid Student: {validatedStudent.name} ({validatedStudent.studentIdField})
                    </div>
                  )}
                </div>

                {validatedStudent && (
                  <div className="subjects-marks-section">
                    <div className="subjects-marks-header">
                      <h3>Add Subject Marks</h3>
                      <button
                        type="button"
                        className="add-subject-btn"
                        onClick={handleAddSubject}
                      >
                        + Add Subject
                      </button>
                    </div>
                    <div className="subjects-marks-list">
                      {subjectMarks.map((subject, index) => (
                        <div key={index} className="subject-marks-item">
                          <div className="subject-select-group">
                            <label>Subject <span className="required">*</span></label>
                            <select
                              value={subject.subjectId}
                              onChange={(e) => handleSubjectMarksChange(index, 'subjectId', e.target.value)}
                              required
                            >
                              <option value="" disabled>Select Subject</option>
                              {availableSubjects.map(sub => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="marks-inputs">
                            <div className="marks-input-group">
                              <label>Marks (0-100) <span className="required">*</span></label>
                              <input
                                type="number"
                                value={subject.marks}
                                onChange={(e) => handleSubjectMarksChange(index, 'marks', e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                placeholder="0-100"
                                required
                              />
                            </div>
                            <div className="marks-input-group">
                              <label>Grade <span className="required">*</span></label>
                              <input
                                type="text"
                                value={subject.grade}
                                onChange={(e) => handleSubjectMarksChange(index, 'grade', e.target.value.toUpperCase())}
                                placeholder="e.g., A, B, C"
                                required
                                maxLength="5"
                              />
                            </div>
                          </div>
                          {subjectMarks.length > 1 && (
                            <button
                              type="button"
                              className="remove-subject-btn"
                              onClick={() => handleRemoveSubject(index)}
                              title="Remove this subject"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validatedStudent && (
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading 
                        ? (editingMarks ? 'Updating...' : 'Saving...') 
                        : (editingMarks ? 'Update Marks' : 'Save Marks')
                      }
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="marks-table">
            {marksRecords.length === 0 ? (
              <div className="empty-state">
                <p>No marks records added yet. Click "Add Marks" to get started.</p>
              </div>
            ) : filteredMarks.length === 0 ? (
              <div className="empty-state">
                <p>No marks records match your search.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Subjects & Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarks.map((record) => (
                    <tr key={record._id}>
                      <td>{record.studentId?.studentId || '-'}</td>
                      <td>{record.studentId?.name || '-'}</td>
                      <td>
                        <div className="subjects-summary-cell">
                          <div className="subjects-summary-text">
                            {record.subjects?.length
                              ? `${record.subjects.length} subject${record.subjects.length === 1 ? '' : 's'}`
                              : 'No subjects recorded'}
                          </div>
                          <button
                            type="button"
                            className="view-subjects-btn"
                            onClick={() => setViewingRecord(record)}
                            disabled={!record.subjects || record.subjects.length === 0}
                          >
                            View
                          </button>
                        </div>
                      </td>
                      <td>
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(record)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(record._id)}
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

      {viewingRecord && (
        <div className="marks-modal-overlay" onClick={() => setViewingRecord(null)}>
          <div className="marks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="marks-modal-header">
              <div>
                <h2>Subject Results</h2>
                <p>
                  {viewingRecord.studentId?.name || 'Unknown Student'} •{' '}
                  {viewingRecord.studentId?.studentId || '--'}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewingRecord(null)}
              >
                Close
              </button>
            </div>
            <div className="marks-modal-body">
              {viewingRecord.subjects && viewingRecord.subjects.length > 0 ? (
                <div className="marks-modal-list">
                  {viewingRecord.subjects.map((sub, index) => {
                    const subject = typeof sub.subjectId === 'object' ? sub.subjectId : null;
                    return (
                      <div key={index} className="marks-modal-item">
                        <div className="marks-modal-item-top">
                          <span className="marks-modal-subject">
                            {subject?.name || 'Unknown Subject'}
                          </span>
                          <span className="marks-modal-grade">{sub.grade}</span>
                        </div>
                        <div className="marks-modal-meta">
                          <span className="marks-modal-label">Marks</span>
                          <span className="marks-modal-value">{sub.marks}</span>
                          {subject?.conductedBy?.name && (
                            <span className="marks-modal-teacher">
                              Teacher: {subject.conductedBy.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="marks-modal-empty">
                  No subjects or marks recorded for this student.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksPage;

