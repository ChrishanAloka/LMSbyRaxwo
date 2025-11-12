import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
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
      const response = await fetch('https://lms-f679.onrender.com/api/subjects');
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
      const response = await fetch('https://lms-f679.onrender.com/api/classes', {
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
      const response = await fetch(`https://lms-f679.onrender.com/api/subjects/${selectedSubject._id}/start-class`, {
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
                                    title="Remove Class"
                                  >
                                    Remove
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
    </div>
  );
};

export default ClassPage;

