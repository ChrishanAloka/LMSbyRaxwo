import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import './ClassesViewPage.css';

const ClassesViewPage = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState(null);
  const [classFormData, setClassFormData] = useState({
    date: '',
    time: ''
  });
  const [attemptCounts, setAttemptCounts] = useState({});
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [selectedClassAttempts, setSelectedClassAttempts] = useState([]);
  const [selectedClassInfo, setSelectedClassInfo] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = () => {
    const userData = localStorage.getItem('user');
    const userTypeData = localStorage.getItem('userType');
    
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
      setUserType(user.type || userTypeData);
    }
  };

  const fetchTeacherClasses = async () => {
    setLoading(true);
    try {
      // Include deleted classes in view my classes
      const response = await fetch('https://lms-f679.onrender.com/api/classes?includeDeleted=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // If admin, show all classes; if teacher, filter by teacher ID
        let classList = [];
        if (userType === 'admin') {
          classList = data.data;
        } else if (currentUserId) {
          classList = data.data.filter(classItem => {
            const teacherId = classItem.teacherId?._id || classItem.teacherId;
            return teacherId?.toString() === currentUserId?.toString();
          });
        }
        setClasses(classList);
        
        // Fetch attempt counts for each class
        fetchAttemptCounts(classList);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
      setLoading(false);
    }
  };

  const fetchAttemptCounts = async (classList) => {
    const counts = {};
    for (const classItem of classList) {
      try {
        const response = await fetch(`https://lms-f679.onrender.com/api/attempts/class/${classItem._id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          counts[classItem._id] = data.count || 0;
        }
      } catch (err) {
        console.error(`Error fetching attempt count for class ${classItem._id}:`, err);
        counts[classItem._id] = 0;
      }
    }
    setAttemptCounts(counts);
  };

  useEffect(() => {
    if (currentUserId && userType) {
      fetchTeacherClasses();
    }
  }, [currentUserId, userType]);

  // Real-time update for break duration display
  useEffect(() => {
    const hasActiveBreak = classes.some(classItem => classItem.breakStatus === 'on_break');
    
    if (hasActiveBreak) {
      const interval = setInterval(() => {
        setCurrentTime(new Date()); // Update time every second for real-time break duration
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [classes]);

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
      const response = await fetch(`https://lms-f679.onrender.com/api/classes/${selectedClassForEdit._id}`, {
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
        fetchTeacherClasses(); // Refresh the list
      } else {
        alert(data.message || 'Failed to update class');
      }
    } catch (err) {
      console.error('Error updating class:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleStartBreak = async () => {
    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/classes/${selectedClassForEdit._id}/break/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the selected class in modal
        setSelectedClassForEdit(data.data);
        fetchTeacherClasses(); // Refresh the list
      } else {
        alert(data.message || 'Failed to start break');
      }
    } catch (err) {
      console.error('Error starting break:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleEndBreak = async () => {
    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/classes/${selectedClassForEdit._id}/break/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the selected class in modal
        setSelectedClassForEdit(data.data);
        fetchTeacherClasses(); // Refresh the list
      } else {
        alert(data.message || 'Failed to end break');
      }
    } catch (err) {
      console.error('Error ending break:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class? It will be removed from the class list but will still appear in "View My Classes" until you remove it permanently.')) {
      return;
    }

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Class deleted successfully. It will still appear in "View My Classes" until removed.');
        fetchTeacherClasses(); // Refresh the list
      } else {
        alert(data.message || 'Failed to delete class');
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleRemoveClass = async (classId) => {
    if (!window.confirm('Are you sure you want to permanently remove this class? This action cannot be undone and all class data will be lost.')) {
      return;
    }

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/classes/${classId}/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Class removed permanently');
        fetchTeacherClasses(); // Refresh the list
      } else {
        alert(data.message || 'Failed to remove class');
      }
    } catch (err) {
      console.error('Error removing class:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleStartClass = async (classId) => {
    if (!window.confirm('Are you sure you want to start this class? Students will be able to see and join this class.')) {
      return;
    }

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/classes/${classId}/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Class started successfully. Students can now view and join this class.');
        fetchTeacherClasses(); // Refresh the list
      } else {
        alert(data.message || 'Failed to start class');
      }
    } catch (err) {
      console.error('Error starting class:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleCloseClass = async (classId) => {
    if (!window.confirm('Are you sure you want to close this class? Attendance will be marked for all active students. Students who left will be marked as absent.')) {
      return;
    }

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/classes/${classId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.attendance?.message || 'Class closed successfully. Attendance has been marked.');
        fetchTeacherClasses(); // Refresh the list
        if (showEditClassModal) {
          setShowEditClassModal(false);
        }
      } else {
        alert(data.message || 'Failed to close class');
      }
    } catch (err) {
      console.error('Error closing class:', err);
      alert('Network error. Please try again.');
    }
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper function to format duration
  const formatDuration = (milliseconds) => {
    if (!milliseconds || milliseconds === 0) return '0 min';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  // Calculate current break duration if on break
  const getCurrentBreakDuration = (classItem) => {
    if (classItem.breakStatus === 'on_break' && classItem.breakStartTime) {
      const startTime = new Date(classItem.breakStartTime);
      return formatDuration(currentTime - startTime);
    }
    return null;
  };

  // Get total break duration
  const getTotalBreakDuration = (classItem) => {
    if (classItem.totalBreakDuration) {
      return formatDuration(classItem.totalBreakDuration);
    }
    return '0 min';
  };

  // View student attempts for a class
  const handleViewAttempts = async (classId) => {
    setShowAttemptsModal(true);
    setLoadingAttempts(true);
    setSelectedClassAttempts([]);
    setSelectedClassInfo(null);

    // Find class information from the classes array
    const classInfo = classes.find(c => c._id === classId);
    if (classInfo) {
      setSelectedClassInfo(classInfo);
    }

    try {
      // Get all attempts (active, left, and attendance status) - include all for attendance view
      const response = await fetch(`https://lms-f679.onrender.com/api/attempts/class/${classId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Sort attempts: attended first, then by attempted time
        const sortedAttempts = [...data.data].sort((a, b) => {
          // First sort by attendance status
          if (a.attendance === 'attended' && b.attendance !== 'attended') return -1;
          if (a.attendance !== 'attended' && b.attendance === 'attended') return 1;
          // Then by created time
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setSelectedClassAttempts(sortedAttempts);
      } else {
        alert(data.message || 'Failed to fetch attempts');
      }
    } catch (err) {
      console.error('Error fetching attempts:', err);
      alert('Network error. Please try again.');
    } finally {
      setLoadingAttempts(false);
    }
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

  // Generate class attendance report (CSV)
  const handleGenerateClassAttendanceReport = () => {
    if (!selectedClassAttempts || selectedClassAttempts.length === 0 || !selectedClassInfo) {
      alert('No attendance data available to generate report');
      return;
    }

    const subjectName = selectedClassInfo.subjectId?.name || 'Unknown Subject';
    const teacherName = selectedClassInfo.teacherId?.name || 'Unknown Teacher';
    const classDate = selectedClassInfo.date || 'N/A';
    const classTime = selectedClassInfo.time || 'N/A';
    const classStatus = selectedClassInfo.status || 'N/A';

    // Calculate statistics
    const totalStudents = selectedClassAttempts.length;
    const attendedCount = selectedClassAttempts.filter(a => a.attendance === 'attended').length;
    const absentCount = selectedClassAttempts.filter(a => a.attendance === 'absent').length;
    const pendingCount = selectedClassAttempts.filter(a => a.attendance === 'pending' || !a.attendance).length;

    // Create CSV content
    let csvContent = `Class Attendance Report\n`;
    csvContent += `\n`;
    csvContent += `Class Information\n`;
    csvContent += `Subject,${subjectName}\n`;
    csvContent += `Teacher,${teacherName}\n`;
    csvContent += `Date,${classDate}\n`;
    csvContent += `Time,${classTime}\n`;
    csvContent += `Status,${classStatus}\n`;
    csvContent += `\n`;
    csvContent += `Attendance Statistics\n`;
    csvContent += `Total Students,${totalStudents}\n`;
    csvContent += `Attended,${attendedCount}\n`;
    csvContent += `Absent,${absentCount}\n`;
    csvContent += `Pending,${pendingCount}\n`;
    csvContent += `\n`;
    csvContent += `Student Details\n`;
    csvContent += `Student ID,Student Name,Email,Attempted Time\n`;

    selectedClassAttempts.forEach((attempt) => {
      const studentId = attempt.studentId || 'N/A';
      const studentName = attempt.studentName || 'N/A';
      const email = attempt.studentEmail || 'N/A';
      const attemptedTime = formatDateTime(attempt.createdAt);
      
      csvContent += `${studentId},${studentName},${email},${attemptedTime}\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Class_Attendance_${subjectName}_${classDate}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.download = fileName.replace(/[^a-z0-9]/gi, '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return classes;
    }
    return classes.filter((classItem) => {
      const subjectName = classItem.subjectId?.name || '';
      const teacherName = classItem.teacherId?.name || '';
      const date = classItem.date || '';
      const status = classItem.status || '';
      return [subjectName, teacherName, date, status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [classes, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredClasses.length) {
      alert('No classes available to generate a report.');
      return;
    }

    const headers = [
      'Subject',
      'Teacher',
      'Date',
      'Time',
      'Status',
      'Break Status',
      'Total Break Duration',
      'Students Attempted'
    ];

    const rows = filteredClasses.map((classItem) => [
      classItem.subjectId?.name || '',
      classItem.teacherId?.name || '',
      classItem.date || '',
      classItem.time || '',
      classItem.status || '',
      classItem.breakStatus || 'none',
      getTotalBreakDuration(classItem),
      attemptCounts[classItem._id] || 0
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
    link.download = `classes-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="classes-view-page">
      <Sidebar />
      <div className="classes-view-main-content">
        <Topbar userName={userType === 'admin' ? 'Admin' : 'Teacher'} />
        
        <div className="classes-view-content">
          <div className="classes-view-header">
            <div>
              <h1>My Started Classes</h1>
              <p className="classes-view-subtitle">
                View and manage all classes you have started
              </p>
            </div>
            <div className="classes-header-actions">
              <div className="classes-search">
                <input
                  type="text"
                  placeholder="Search by subject, teacher, or date"
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
                disabled={filteredClasses.length === 0}
              >
                Generate Report
              </button>
              <button className="back-btn" onClick={() => navigate('/admin/class')}>
                Back to Classes
              </button>
            </div>
          </div>

          <div className="classes-table-container">
            {loading ? (
              <div className="empty-state">
                <p>Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="empty-state">
                <p>No classes started yet.</p>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="empty-state">
                <p>No classes match your search.</p>
              </div>
            ) : (
              <table className="class-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Break Status</th>
                    <th>Break Time</th>
                    <th>Students Attempted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((classItem) => {
                    const currentBreakDuration = getCurrentBreakDuration(classItem);
                    const totalBreakDuration = getTotalBreakDuration(classItem);
                    
                    return (
                      <tr key={classItem._id}>
                        <td className="class-name">{classItem.subjectId?.name || 'N/A'}</td>
                        <td>{classItem.date}</td>
                        <td>{classItem.time}</td>
                        <td>
                          <span className={`class-status-badge status-${classItem.status}`}>
                            {classItem.status}
                          </span>
                        </td>
                        <td>
                          {classItem.breakStatus && classItem.breakStatus !== 'none' ? (
                            <span className={`break-status-badge break-${classItem.breakStatus === 'on_break' ? 'on-break' : 'class-starting'}`}>
                              {classItem.breakStatus === 'on_break' ? 'On Break' : 'Class Starting'}
                            </span>
                          ) : (
                            <span className="break-status-badge break-none">None</span>
                          )}
                        </td>
                        <td>
                          <div className="break-time-info">
                            {currentBreakDuration ? (
                              <div>
                                <div className="break-current">
                                  Current: {currentBreakDuration}
                                </div>
                                <div className="break-total">
                                  Total: {totalBreakDuration}
                                </div>
                              </div>
                            ) : (
                              <div className="break-total">
                                Total: {totalBreakDuration}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="attempt-count-cell">
                            <span 
                              className="attempt-count-link"
                              onClick={() => handleViewAttempts(classItem._id)}
                              title="View student attempts"
                            >
                              {attemptCounts[classItem._id] || 0}
                            </span>
                          </div>
                        </td>
                        <td className="actions-cell">
                          {classItem.isDeleted ? (
                            <div className="action-buttons-group">
                              <button 
                                className="view-attendance-btn-small"
                                onClick={() => handleViewAttempts(classItem._id)}
                                title="View Student Attendance"
                              >
                                View Attendance
                              </button>
                              <span className="class-deleted-label">Deleted</span>
                              <button 
                                className="remove-class-btn-small"
                                onClick={() => handleRemoveClass(classItem._id)}
                                title="Drop Record Permanently"
                              >
                                Drop Record
                              </button>
                            </div>
                          ) : classItem.status === 'completed' ? (
                            <div className="action-buttons-group">
                              <button 
                                className="view-attendance-btn-small"
                                onClick={() => handleViewAttempts(classItem._id)}
                                title="View Student Attendance"
                              >
                                View Attendance
                              </button>
                              <button 
                                className="delete-class-btn-small"
                                onClick={() => handleDeleteClass(classItem._id)}
                                title="Drop Record"
                              >
                                Drop Record
                              </button>
                            </div>
                          ) : classItem.status === 'scheduled' ? (
                            <div className="action-buttons-group">
                              <button 
                                className="start-class-btn-small"
                                onClick={() => handleStartClass(classItem._id)}
                                title="Start Class"
                              >
                                Start Class
                              </button>
                              <button 
                                className="edit-class-btn-small"
                                onClick={() => handleEditClassClick(classItem)}
                                title="Edit Class"
                              >
                                Edit
                              </button>
                              <button 
                                className="delete-class-btn-small"
                                onClick={() => handleDeleteClass(classItem._id)}
                                title="Drop Record"
                              >
                                Drop Record
                              </button>
                            </div>
                          ) : (
                            <div className="action-buttons-group">
                              <button 
                                className="close-class-btn-small"
                                onClick={() => handleCloseClass(classItem._id)}
                                title="Close Class"
                              >
                                Close Class
                              </button>
                              <button 
                                className="edit-class-btn-small"
                                onClick={() => handleEditClassClick(classItem)}
                                title="Edit Class"
                              >
                                Edit
                              </button>
                              <button 
                                className="delete-class-btn-small"
                                onClick={() => handleDeleteClass(classItem._id)}
                                title="Drop Record"
                              >
                                Drop Record
                              </button>
                            </div>
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

      {/* Edit Class Modal */}
      {showEditClassModal && selectedClassForEdit && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Class</h2>
            <div className="modal-body">
              <div className="form-group compact-group">
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

              {selectedClassForEdit?.status !== 'completed' && (
                <div className="break-actions">
                  <h3>Break Management</h3>
                  <div className="break-buttons">
                    <button 
                      className="start-break-btn"
                      onClick={handleStartBreak}
                      disabled={selectedClassForEdit?.breakStatus === 'on_break'}
                    >
                      Start Break
                    </button>
                    <button 
                      className="end-break-btn"
                      onClick={handleEndBreak}
                      disabled={selectedClassForEdit?.breakStatus !== 'on_break'}
                    >
                      End Break
                    </button>
                  </div>
                </div>
              )}
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

      {/* Attempts Modal */}
      {showAttemptsModal && (
        <div className="modal-overlay" onClick={() => setShowAttemptsModal(false)}>
          <div className="modal-content attempts-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Student Attendance</h2>
            {selectedClassInfo && (
              <div className="class-info-header">
                <p><strong>Subject:</strong> {selectedClassInfo.subjectId?.name || 'N/A'}</p>
                <p><strong>Teacher:</strong> {selectedClassInfo.teacherId?.name || 'N/A'}</p>
                <p><strong>Date:</strong> {selectedClassInfo.date || 'N/A'} | <strong>Time:</strong> {selectedClassInfo.time || 'N/A'}</p>
              </div>
            )}
            {loadingAttempts ? (
              <div className="empty-state">
                <p>Loading attempts...</p>
              </div>
            ) : selectedClassAttempts.length === 0 ? (
              <div className="empty-state">
                <p>No students have attempted this class yet.</p>
              </div>
            ) : (
              <div className="attempts-list">
                <table className="attempts-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Attempted Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClassAttempts.map((attempt) => (
                      <tr key={attempt._id}>
                        <td>{attempt.studentId}</td>
                        <td>{attempt.studentName}</td>
                        <td>{attempt.studentEmail || 'N/A'}</td>
                        <td>{formatDateTime(attempt.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button 
                className="generate-report-btn" 
                onClick={handleGenerateClassAttendanceReport}
                disabled={!selectedClassAttempts || selectedClassAttempts.length === 0 || !selectedClassInfo}
              >
                Generate Report
              </button>
              <button className="cancel-btn" onClick={() => setShowAttemptsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesViewPage;

