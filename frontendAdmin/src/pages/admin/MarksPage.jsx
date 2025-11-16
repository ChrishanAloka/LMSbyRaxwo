import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
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
  const [subjectMarks, setSubjectMarks] = useState([]);
  const [editingMarks, setEditingMarks] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/marks', {
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

  const validateStudentId = async () => {
    if (!studentIdInput.trim()) {
      setStudentValidationError('Please enter a Student ID');
      return;
    }

    setValidatingStudent(true);
    setStudentValidationError('');
    setValidatedStudent(null);
    setSubjectMarks([]);

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/marks/validate-student/${studentIdInput.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success && data.valid) {
        setValidatedStudent(data.data);
        // Initialize subject marks array - subjects come populated from backend
        const initialMarks = data.data.subjects.map(subject => ({
          subjectId: typeof subject === 'object' ? subject._id : subject,
          subjectName: typeof subject === 'object' ? subject.name : 'Loading...',
          marks: '',
          grade: ''
        }));
        setSubjectMarks(initialMarks);
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
    setSubjectMarks(updatedMarks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all subjects have marks and grade
    const incompleteSubjects = subjectMarks.filter(sub => !sub.marks || !sub.grade);
    if (incompleteSubjects.length > 0) {
      setError('Please enter marks and grade for all subjects');
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
        ? `https://lms-f679.onrender.com/api/marks/${editingMarks._id}`
        : 'https://lms-f679.onrender.com/api/marks';
      
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
    const initialMarks = marksRecord.subjects.map(sub => ({
      subjectId: typeof sub.subjectId === 'object' ? sub.subjectId._id : sub.subjectId,
      subjectName: typeof sub.subjectId === 'object' ? sub.subjectId.name : '',
      marks: sub.marks.toString(),
      grade: sub.grade
    }));
    setSubjectMarks(initialMarks);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marks record?')) return;

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/marks/${id}`, {
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
                  <label htmlFor="studentId">Student ID <span className="required">*</span></label>
                  <div className="student-id-input-group">
                    <input
                      type="text"
                      id="studentId"
                      value={studentIdInput}
                      onChange={(e) => {
                        setStudentIdInput(e.target.value);
                        setStudentValidationError('');
                        setValidatedStudent(null);
                        setSubjectMarks([]);
                      }}
                      placeholder="Enter Student ID"
                      disabled={!!editingMarks}
                      required
                    />
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

                {validatedStudent && validatedStudent.subjects.length > 0 && (
                  <div className="subjects-marks-section">
                    <h3>Enter Marks for Enrolled Subjects</h3>
                    <div className="subjects-marks-list">
                      {subjectMarks.map((subject, index) => (
                        <div key={index} className="subject-marks-item">
                          <div className="subject-name">{subject.subjectName || 'Loading...'}</div>
                          <div className="marks-inputs">
                            <div className="marks-input-group">
                              <label>Marks (0-100)</label>
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
                              <label>Grade</label>
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validatedStudent && validatedStudent.subjects.length === 0 && (
                  <div className="no-subjects-message">
                    This student has no enrolled subjects. Please enroll the student in subjects first.
                  </div>
                )}

                {validatedStudent && validatedStudent.subjects.length > 0 && (
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

