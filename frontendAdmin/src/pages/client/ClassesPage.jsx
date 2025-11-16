import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import './ClassesPage.css';
import teacherIcon from '../../assets/teacher.png';
import dateIcon from '../../assets/date.png';
import timeIcon from '../../assets/time.png';
import emailIcon from '../../assets/email.png';

const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [attemptedClasses, setAttemptedClasses] = useState({});
  const [showStudentIdModal, setShowStudentIdModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [classes, searchQuery]);

  useEffect(() => {
    if (classes.length > 0) {
      checkAllAttemptStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes.length]);

  const filterClasses = () => {
    let filtered = [...classes];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(classItem =>
        classItem.subjectId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredClasses(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const checkAllAttemptStatuses = async () => {
    // Get stored attempts from localStorage
    const storedAttempts = JSON.parse(localStorage.getItem('attemptedClasses') || '{}');
    const newAttemptedClasses = {};
    
    // Verify stored attempts are still valid
    for (const classItem of classes) {
      if (storedAttempts[classItem._id]) {
        const storedAttempt = storedAttempts[classItem._id];
        const attempted = await checkAttemptStatus(classItem._id, storedAttempt.studentId);
        if (attempted) {
          newAttemptedClasses[classItem._id] = storedAttempt;
        } else {
          // Remove invalid stored attempt
          delete storedAttempts[classItem._id];
          localStorage.setItem('attemptedClasses', JSON.stringify(storedAttempts));
        }
      }
    }
    
    setAttemptedClasses(newAttemptedClasses);
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/classes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Only show ongoing classes to students (not scheduled, completed, or cancelled)
        const ongoingClasses = data.data.filter(classItem => 
          classItem.status === 'ongoing' && !classItem.isDeleted
        );
        setClasses(ongoingClasses);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setLoading(false);
    }
  };


  const handleAttemptClick = (classId) => {
    setSelectedClassId(classId);
    setShowStudentIdModal(true);
    setStudentIdInput('');
    setErrorMessage('');
  };

  const handleAttemptClass = async () => {
    if (!studentIdInput.trim()) {
      setErrorMessage('Please enter your student ID');
      return;
    }

    try {
      const response = await fetch('https://lms-f679.onrender.com/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClassId,
          studentId: studentIdInput.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update attempted status
        const attemptData = { attempted: true, studentId: studentIdInput.trim() };
        setAttemptedClasses(prev => ({
          ...prev,
          [selectedClassId]: attemptData
        }));
        
        // Store in localStorage
        const storedAttempts = JSON.parse(localStorage.getItem('attemptedClasses') || '{}');
        storedAttempts[selectedClassId] = attemptData;
        localStorage.setItem('attemptedClasses', JSON.stringify(storedAttempts));
        
        setShowStudentIdModal(false);
        setStudentIdInput('');
        setErrorMessage('');
        fetchClasses(); // Refresh classes to update counts
        alert('Successfully attempted class!');
      } else {
        setErrorMessage(data.message || 'Invalid student ID');
      }
    } catch (err) {
      console.error('Error attempting class:', err);
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handleLeaveClass = async (classId, studentId) => {
    if (!window.confirm('Are you sure you want to leave this class?')) {
      return;
    }

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/attempts/${classId}/${studentId}/leave`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAttemptedClasses(prev => {
          const updated = { ...prev };
          delete updated[classId];
          return updated;
        });
        
        // Remove from localStorage (so they can attempt again if needed)
        const storedAttempts = JSON.parse(localStorage.getItem('attemptedClasses') || '{}');
        delete storedAttempts[classId];
        localStorage.setItem('attemptedClasses', JSON.stringify(storedAttempts));
        
        fetchClasses(); // Refresh classes to update counts
        alert(data.message || 'Left class successfully');
      } else {
        alert(data.message || 'Failed to leave class');
      }
    } catch (err) {
      console.error('Error leaving class:', err);
      alert('Network error. Please try again.');
    }
  };

  const checkAttemptStatus = async (classId, studentId) => {
    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/attempts/check/${classId}/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data.attempted || false;
    } catch (err) {
      console.error('Error checking attempt status:', err);
      return false;
    }
  };

  const getBreakStatusText = (breakStatus) => {
    if (breakStatus === 'on_break') return 'On Break';
    if (breakStatus === 'class_starting') return 'Class Starting';
    return null;
  };

  const getBreakStatusClass = (breakStatus) => {
    if (breakStatus === 'on_break') return 'break-on-break';
    if (breakStatus === 'class_starting') return 'break-class-starting';
    return '';
  };

  return (
    <div className="classes-page">
      <Header onSearch={handleSearch} />
      
      <main className="classes-main">
        <div className="classes-header">
          <h1 className="classes-title">All Classes</h1>
          <p className="classes-description">
            View all classes published by teachers and join your preferred classes.
          </p>
        </div>

        {loading ? (
          <div className="classes-empty">
            <p>Loading classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="classes-empty">
            <p>
              {searchQuery.trim() 
                ? `No classes found matching "${searchQuery}". Try a different search term.`
                : 'No classes available at the moment. Please check back later.'
              }
            </p>
          </div>
        ) : (
          <div className="classes-container">
            {filteredClasses.map((classItem) => (
              <div key={classItem._id} className="class-card">
                {classItem.subjectId?.image && (
                  <div className="class-image-container">
                    <img 
                      src={`https://lms-f679.onrender.com${classItem.subjectId.image}`} 
                      alt={classItem.subjectId.name}
                      className="class-image"
                    />
                  </div>
                )}
                
                <div className="class-card-content">
                  <div className="class-header-info">
                    <h2 className="class-subject-name">{classItem.subjectId?.name || 'N/A'}</h2>
                    <span className={`class-status-badge status-${classItem.status}`}>
                      {classItem.status}
                    </span>
                  </div>
                  
                  <p className="class-description">
                    {classItem.subjectId?.description || 'No description available'}
                  </p>

                  {classItem.breakStatus && classItem.breakStatus !== 'none' && (
                    <div className={`break-status-badge ${getBreakStatusClass(classItem.breakStatus)}`}>
                      {getBreakStatusText(classItem.breakStatus)}
                    </div>
                  )}

                  <div className="class-details-grid">
                    <div className="class-detail-card">
                      <img src={teacherIcon} alt="Teacher" className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-title">Teacher</span>
                        <span className="detail-text">{classItem.teacherId?.name || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="class-detail-card">
                      <img src={dateIcon} alt="Date" className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-title">Date</span>
                        <span className="detail-text">{classItem.date}</span>
                      </div>
                    </div>

                    <div className="class-detail-card">
                      <img src={timeIcon} alt="Time" className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-title">Time</span>
                        <span className="detail-text">{classItem.time}</span>
                      </div>
                    </div>

                    <div className="class-detail-card">
                      <img src={emailIcon} alt="Email" className="detail-icon" />
                      <div className="detail-content">
                        <span className="detail-title">Email</span>
                        <span className="detail-text">{classItem.teacherId?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="class-action-buttons">
                    {attemptedClasses[classItem._id]?.attempted ? (
                      <>
                        <button 
                          className="attempted-class-btn-page"
                          disabled
                        >
                          Attempted
                        </button>
                        <button 
                          className="leave-class-btn-page"
                          onClick={() => handleLeaveClass(classItem._id, attemptedClasses[classItem._id].studentId)}
                        >
                          Leave Class
                        </button>
                      </>
                    ) : (
                      <button 
                        className="attempt-class-btn-page"
                        onClick={() => handleAttemptClick(classItem._id)}
                      >
                        Attempt Class
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Student ID Modal */}
      {showStudentIdModal && (
        <div className="modal-overlay" onClick={() => setShowStudentIdModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Enter Student ID</h2>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="studentId">Student ID *</label>
                <input
                  type="text"
                  id="studentId"
                  value={studentIdInput}
                  onChange={(e) => {
                    setStudentIdInput(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter your student ID"
                  autoFocus
                />
                {errorMessage && (
                  <span className="error-message">{errorMessage}</span>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowStudentIdModal(false)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleAttemptClass}>
                Attempt Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;

