import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import './ClassPage.css';

const ClassPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const navigate = useNavigate();
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState(null);
  const [classFormData, setClassFormData] = useState({
    date: '',
    time: ''
  });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendancePeriod, setAttendancePeriod] = useState('weekly'); // 'weekly' or 'monthly'

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchUserInfo();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (currentUserId && userType) {
      fetchAllClasses();
    }
  }, [currentUserId, userType]);

  const fetchUserInfo = () => {
    // Get current user ID and type from localStorage
    const userData = localStorage.getItem('user');
    const userTypeData = localStorage.getItem('userType');
    
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      setUserType(user.type || userTypeData);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to fetch subjects');
      setLoading(false);
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Filter by teacher if not admin
        if (userType !== 'admin' && currentUserId) {
          const filtered = data.data.filter(classItem => {
            const teacherId = classItem.teacherId?._id || classItem.teacherId;
            return teacherId?.toString() === currentUserId?.toString();
          });
          setClasses(filtered);
        } else {
          setClasses(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const handleStartClassClick = (subject) => {
    setSelectedSubject(subject);
    setShowClassModal(true);
    // Set default date to today and time to current hour
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    setClassFormData({ date: dateStr, time: timeStr });
  };

  const handleCloseModal = () => {
    setShowClassModal(false);
    setSelectedSubject(null);
    setClassFormData({ date: '', time: '' });
  };

  const handleStartClass = async () => {
    if (!classFormData.date || !classFormData.time) {
      alert('Please select both date and time');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects/${selectedSubject._id}/start-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: classFormData.date,
          time: classFormData.time
        })
      });

      const data = await response.json();

        if (response.ok && data.success) {
        alert(data.message);
        setShowClassModal(false);
        setSelectedSubject(null);
        // Refresh subjects to show the updated status
        fetchSubjects();
        fetchAllClasses(); // Refresh classes table
      } else {
        alert(data.message || 'Failed to start class');
      }
    } catch (err) {
      console.error('Error starting class:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleViewClassesClick = () => {
    navigate('/admin/classes/view');
  };

  const handleEditClassClick = (classItem) => {
    setSelectedClassForEdit(classItem);
    setClassFormData({
      date: classItem.date,
      time: classItem.time
    });
    setShowEditClassModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditClassModal(false);
    setSelectedClassForEdit(null);
    setClassFormData({ date: '', time: '' });
  };

  const handleUpdateClass = async () => {
    if (!classFormData.date || !classFormData.time) {
      alert('Please select both date and time');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${selectedClassForEdit._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: classFormData.date,
          time: classFormData.time
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Class updated successfully');
        setShowEditClassModal(false);
        setSelectedClassForEdit(null);
        fetchSubjects(); // Refresh subjects to show updated state
        if (currentUserId && userType) {
          fetchAllClasses(); // Refresh the table
        }
      } else {
        alert(data.message || 'Failed to update class');
      }
    } catch (err) {
      console.error('Error updating class:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class? It will be removed from the class list but will still appear in "View My Classes" until you remove it permanently.')) {
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Class deleted successfully. It will still appear in "View My Classes" until removed.');
        setClasses(prev => prev.filter(cls => cls._id !== classId));
        fetchSubjects(); // Refresh subjects to show updated state
        if (currentUserId && userType) {
          fetchAllClasses(); // Refresh the table
        }
      } else {
        alert(data.message || 'Failed to delete class');
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('Network error. Please try again.');
    }
  };

  // Check if current user can start a class for a subject
  const canStartClass = (subject) => {
    // Admins can start any class
    if (userType === 'admin') {
      return true;
    }
    
    // Teachers can only start their own classes
    const teacherId = subject.conductedBy?._id || subject.conductedBy;
    return teacherId?.toString() === currentUserId?.toString();
  };

  // Find if a class exists for the given subject
  const findClassForSubject = (subjectId) => {
    return classes.find(cls => 
      (cls.subjectId?._id || cls.subjectId)?.toString() === subjectId?.toString() &&
      !cls.isDeleted
    );
  };

  // Search for student weekly attendance
  const handleSearchStudentAttendance = async () => {
    if (!studentSearchTerm.trim()) {
      alert('Please enter a student ID or name');
      return;
    }

    setLoadingAttendance(true);
    setStudentAttendance(null);

    try {
      // Determine if search term is likely an ID or name
      // IDs typically: pure numbers, or start with letters followed by numbers (e.g., ID0001, STU123)
      // Names typically: contain spaces or are longer text strings
      const searchTerm = studentSearchTerm.trim();
      const isLikelyId = /^[A-Za-z]*\d+$/.test(searchTerm) && searchTerm.length <= 20 && !searchTerm.includes(' ');
      const queryParam = isLikelyId ? 'studentId' : 'studentName';
      
      const response = await fetch(
        `${API_CONFIG.API_URL}/attempts/attendance/weekly?${queryParam}=${encodeURIComponent(searchTerm)}&period=${attendancePeriod}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStudentAttendance(data);
        setShowAttendanceModal(true);
      } else {
        alert(data.message || 'Student not found or no attendance records for this week');
      }
    } catch (err) {
      console.error('Error fetching student attendance:', err);
      alert('Network error. Please try again.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false);
    setStudentAttendance(null);
    setStudentSearchTerm('');
  };

  // Generate attendance report (CSV)
  const handleGenerateAttendanceReport = () => {
    if (!studentAttendance) return;

    const period = attendancePeriod === 'weekly' ? 'Weekly' : 'Monthly';
    const studentName = studentAttendance.student.name;
    const studentId = studentAttendance.student.studentId;
    const dateRange = `${formatDate(studentAttendance.dateRange.start)} - ${formatDate(studentAttendance.dateRange.end)}`;

    // Create CSV content
    let csvContent = `${period} Attendance Report\n`;
    csvContent += `Student: ${studentName} (${studentId})\n`;
    csvContent += `Period: ${dateRange}\n`;
    csvContent += `\n`;
    csvContent += `Overall Statistics\n`;
    csvContent += `Total Classes,${studentAttendance.overallStatistics.totalClasses}\n`;
    csvContent += `Attended,${studentAttendance.overallStatistics.attended}\n`;
    csvContent += `Absent,${studentAttendance.overallStatistics.absent}\n`;
    csvContent += `Pending,${studentAttendance.overallStatistics.pending}\n`;
    csvContent += `\n`;

    // Add subject-wise data
    if (studentAttendance.attendanceBySubject && studentAttendance.attendanceBySubject.length > 0) {
      studentAttendance.attendanceBySubject.forEach((subject) => {
        csvContent += `\nSubject: ${subject.subjectName}\n`;
        csvContent += `Total Classes,${subject.statistics.total}\n`;
        csvContent += `Attended,${subject.statistics.attended}\n`;
        csvContent += `Absent,${subject.statistics.absent}\n`;
        csvContent += `Pending,${subject.statistics.pending}\n`;
        csvContent += `\n`;
        csvContent += `Class Details\n`;
        csvContent += `Teacher,Date,Time,Class Status,Attendance\n`;
        
        subject.classes.forEach((attempt) => {
          const teacher = attempt.classId?.teacherId?.name || 'N/A';
          const date = attempt.classId?.date || 'N/A';
          const time = attempt.classId?.time || 'N/A';
          const classStatus = attempt.classId?.status || 'N/A';
          const attendance = attempt.attendance === 'attended' ? 'Attended' : 
                            attempt.attendance === 'absent' ? 'Absent' : 'Pending';
          
          csvContent += `${teacher},${date},${time},${classStatus},${attendance}\n`;
        });
        csvContent += `\n`;
      });
    } else {
      csvContent += `No attendance records found.\n`;
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${period}_Attendance_${studentName}_${studentId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.download = fileName.replace(/[^a-z0-9]/gi, '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isTeacherUser = ['teacher', 'employee'].includes(userType);

  return (
    <div className="class-page">
      <Sidebar />
      <div className="class-main-content">
        <Topbar userName="Admin" />
        
        <div className="class-content">
          <div className="class-header">
            <div>
              <h1>Class Management</h1>
              <p className="class-subtitle">
                {userType === 'admin' 
                  ? 'View all class details and manage classes' 
                  : 'View all subjects and start your assigned classes'}
              </p>
            </div>
            {(userType === 'admin' || isTeacherUser) && (
              <button className="view-classes-btn" onClick={handleViewClassesClick}>
                View My Classes
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Student Attendance Search Section - Admin Only */}
          {userType === 'admin' && (
            <div className="student-attendance-search-section">
              <div className="attendance-search-header">
                <h2>Student Attendance</h2>
                <p className="attendance-search-subtitle">Search by student ID or name to view attendance</p>
              </div>
              <div className="attendance-search-box">
                <input
                  type="text"
                  placeholder="Enter student ID or name"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchStudentAttendance();
                    }
                  }}
                  className="attendance-search-input"
                />
                <div className="attendance-period-toggle">
                  <button
                    className={`period-btn ${attendancePeriod === 'weekly' ? 'active' : ''}`}
                    onClick={() => setAttendancePeriod('weekly')}
                  >
                    Weekly
                  </button>
                  <button
                    className={`period-btn ${attendancePeriod === 'monthly' ? 'active' : ''}`}
                    onClick={() => setAttendancePeriod('monthly')}
                  >
                    Monthly
                  </button>
                </div>
                <button
                  className="attendance-search-btn"
                  onClick={handleSearchStudentAttendance}
                  disabled={loadingAttendance || !studentSearchTerm.trim()}
                >
                  {loadingAttendance ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          <div className="class-table-container">
            {loading ? (
              <div className="empty-state">
                <p>Loading classes...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="empty-state">
                <p>No subjects added yet.</p>
              </div>
            ) : (
              <table className="class-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Conducted By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => {
                    const canStart = canStartClass(subject);
                    const isTeacherForThisClass = (subject.conductedBy?._id || subject.conductedBy)?.toString() === currentUserId?.toString();
                    const existingClass = findClassForSubject(subject._id);
                    const canEdit = userType === 'admin' || isTeacherForThisClass;
                    
                    return (
                      <tr key={subject._id}>
                        <td className="class-name">{subject.name}</td>
                        <td className="conducted-by">{subject.conductedBy?.name || 'N/A'}</td>
                        <td className="actions-cell">
                          {existingClass ? (
                            <>
                              <span className="class-started-label">Class Started</span>
                              {canEdit && existingClass && (
                                <>
                                  <button 
                                    className="edit-class-btn-small"
                                    onClick={() => handleEditClassClick(existingClass)}
                                    title="Update Class"
                                  >
                                    Update
                                  </button>
                                  <button 
                                    className="delete-class-btn-small"
                                    onClick={() => handleDeleteClass(existingClass._id)}
                                    title="End Class"
                                  >
                                    End Class
                                  </button>
                                </>
                              )}
                            </>
                          ) : canStart ? (
                            <button 
                              className="start-class-btn"
                              onClick={() => handleStartClassClick(subject)}
                              title={userType === 'admin' ? 'Admin can start any class' : 'Start this class'}
                            >
                              Start Class
                            </button>
                          ) : userType === 'admin' ? (
                            <span className="no-access-message">Not Assigned Teacher</span>
                          ) : (
                            <span className="no-access-message">Not Your Class</span>
                          )}
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

      {/* Class Schedule Modal */}
      {showClassModal && selectedSubject && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Schedule Class</h2>
            <div className="modal-body">
              <div className="form-group">
                <label>Subject Name</label>
                <input 
                  type="text" 
                  value={selectedSubject.name} 
                  disabled 
                  className="disabled-input"
                />
              </div>
              
              <div className="form-group">
                <label>Conducted By</label>
                <input 
                  type="text" 
                  value={selectedSubject.conductedBy?.name || 'N/A'} 
                  disabled 
                  className="disabled-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Class Date *</label>
                  <input
                    type="date"
                    id="date"
                    value={classFormData.date}
                    onChange={(e) => setClassFormData({ ...classFormData, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Class Time *</label>
                  <input
                    type="time"
                    id="time"
                    value={classFormData.time}
                    onChange={(e) => setClassFormData({ ...classFormData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleStartClass}>
                Start Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && selectedClassForEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Class</h2>
            <div className="modal-body">
              <div className="form-group">
                <label>Subject Name</label>
                <input 
                  type="text" 
                  value={selectedClassForEdit.subjectId?.name || 'N/A'} 
                  disabled 
                  className="disabled-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-date">Class Date *</label>
                  <input
                    type="date"
                    id="edit-date"
                    value={classFormData.date}
                    onChange={(e) => setClassFormData({ ...classFormData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-time">Class Time *</label>
                  <input
                    type="time"
                    id="edit-time"
                    value={classFormData.time}
                    onChange={(e) => setClassFormData({ ...classFormData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseEditModal}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleUpdateClass}>
                Update Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Attendance Modal */}
      {showAttendanceModal && studentAttendance && (
        <div className="modal-overlay" onClick={handleCloseAttendanceModal}>
          <div className="modal-content attendance-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{attendancePeriod === 'weekly' ? 'Weekly' : 'Monthly'} Attendance - {studentAttendance.student.name}</h2>
            <div className="attendance-student-info">
              <p><strong>Student ID:</strong> {studentAttendance.student.studentId}</p>
              <p><strong>Email:</strong> {studentAttendance.student.email}</p>
              <p><strong>Period:</strong> {formatDate(studentAttendance.dateRange.start)} - {formatDate(studentAttendance.dateRange.end)}</p>
            </div>
            
            <div className="attendance-statistics">
              <div className="stat-card">
                <div className="stat-value">{studentAttendance.overallStatistics.totalClasses}</div>
                <div className="stat-label">Total Classes</div>
              </div>
              <div className="stat-card stat-attended">
                <div className="stat-value">{studentAttendance.overallStatistics.attended}</div>
                <div className="stat-label">Attended</div>
              </div>
              <div className="stat-card stat-absent">
                <div className="stat-value">{studentAttendance.overallStatistics.absent}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-card stat-pending">
                <div className="stat-value">{studentAttendance.overallStatistics.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>

            <div className="attendance-list-container">
              {studentAttendance.attendanceBySubject && studentAttendance.attendanceBySubject.length === 0 ? (
                <div className="empty-state">
                  <p>No attendance records for this {attendancePeriod}.</p>
                </div>
              ) : (
                <div className="attendance-by-subject">
                  {studentAttendance.attendanceBySubject.map((subject) => (
                    <div key={subject.subjectId} className="subject-attendance-group">
                      <div className="subject-header">
                        <h3 className="subject-name">{subject.subjectName}</h3>
                        <div className="subject-stats">
                          <span className="subject-stat-item">
                            <strong>Total:</strong> {subject.statistics.total}
                          </span>
                          <span className="subject-stat-item stat-attended">
                            <strong>Attended:</strong> {subject.statistics.attended}
                          </span>
                          <span className="subject-stat-item stat-absent">
                            <strong>Absent:</strong> {subject.statistics.absent}
                          </span>
                          <span className="subject-stat-item stat-pending">
                            <strong>Pending:</strong> {subject.statistics.pending}
                          </span>
                        </div>
                      </div>
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>Teacher</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subject.classes.map((attempt) => (
                            <tr key={attempt._id}>
                              <td>{attempt.classId?.teacherId?.name || 'N/A'}</td>
                              <td>{attempt.classId?.date || 'N/A'}</td>
                              <td>{attempt.classId?.time || 'N/A'}</td>
                              <td>
                                <span className={`class-status-badge status-${attempt.classId?.status || 'unknown'}`}>
                                  {attempt.classId?.status || 'N/A'}
                                </span>
                              </td>
                              <td>
                                {attempt.attendance ? (
                                  <span className={`attendance-badge attendance-${attempt.attendance}`}>
                                    {attempt.attendance === 'attended' ? 'Attended' : 
                                     attempt.attendance === 'absent' ? 'Absent' : 'Pending'}
                                  </span>
                                ) : (
                                  <span className="attendance-badge attendance-pending">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="generate-report-btn" 
                onClick={handleGenerateAttendanceReport}
                disabled={!studentAttendance || (studentAttendance.attendanceBySubject && studentAttendance.attendanceBySubject.length === 0)}
              >
                Generate Report
              </button>
              <button className="cancel-btn" onClick={handleCloseAttendanceModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassPage;

