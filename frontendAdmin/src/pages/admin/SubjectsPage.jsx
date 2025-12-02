import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import './SubjectsPage.css';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    conductedBy: '',
    image: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchSubjects();
    fetchEmployees();
  }, []);

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
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://lms-f679.onrender.com/api/admin/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Filter only teachers
        const teachers = data.data.filter(emp => emp.role.toLowerCase() === 'teacher');
        setEmployees(teachers);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = editingSubject
        ? `https://lms-f679.onrender.com/api/subjects/${editingSubject._id}`
        : 'https://lms-f679.onrender.com/api/subjects';
      
      const method = editingSubject ? 'PUT' : 'POST';
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('conductedBy', formData.conductedBy);
      formDataToSend.append('description', formData.description);
      
      // If no file is selected, use the image URL
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchSubjects();
        setFormData({ name: '', conductedBy: '', image: '', description: '' });
        setImageFile(null);
        setShowForm(false);
        setEditingSubject(null);
      } else {
        setError(data.message || 'Failed to save subject');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      conductedBy: subject.conductedBy._id || subject.conductedBy,
      image: (subject.image && subject.image.includes('/uploads/')) ? '' : subject.image || '',
      description: subject.description
    });
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      const response = await fetch(`https://lms-f679.onrender.com/api/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchSubjects();
      } else {
        alert(data.message || 'Failed to delete subject');
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSubject(null);
    setFormData({ name: '', conductedBy: '', image: '', description: '' });
    setImageFile(null);
    setError('');
  };

  const filteredSubjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return subjects;
    }

    return subjects.filter((subject) => {
      const teacherName = subject.conductedBy?.name || '';
      return [subject.name, teacherName, subject.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [subjects, searchTerm]);

  const handleGenerateReport = () => {
    if (!filteredSubjects.length) {
      alert('No subjects available to generate a report.');
      return;
    }

    const headers = [
      'Subject Name',
      'Conducted By',
      'Description'
    ];

    const rows = filteredSubjects.map((subject) => [
      subject.name || '',
      subject.conductedBy?.name || '',
      subject.description || ''
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
    link.download = `subjects-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="subjects-page">
      <Sidebar />
      <div className="subjects-main-content">
        <Topbar userName="Chester" />
        
        <div className="subjects-content">
          <div className="subjects-header">
            <h1>Subjects</h1>
            <div className="subjects-header-actions">
              <div className="subjects-search">
                <input
                  type="text"
                  placeholder="Search by subject name or teacher"
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
                disabled={filteredSubjects.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-subject-btn" 
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Cancel' : '+ Add New Subject'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="subject-form-container">
              <form onSubmit={handleSubmit} className="subject-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Subject Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter subject name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="conductedBy">Conducted By (Teacher)</label>
                    <select
                      id="conductedBy"
                      name="conductedBy"
                      value={formData.conductedBy}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a teacher</option>
                      {employees.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="image">Upload Image</label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={(e) => {
                        setImageFile(e.target.files[0]);
                        setError('');
                      }}
                    />
                    {!imageFile && formData.image && (
                      <p className="image-url-info">Or enter image URL:</p>
                    )}
                    {!imageFile && formData.image && (
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.image}
                        onChange={handleInputChange}
                        placeholder="Enter image URL"
                      />
                    )}
                    {imageFile && (
                      <p className="file-selected">Selected: {imageFile.name}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter subject description"
                    required
                    rows="4"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <p>Loading subjects...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="empty-state">
              <p>No subjects added yet. Click "Add New Subject" to get started.</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="empty-state">
              <p>No subjects match your search.</p>
            </div>
          ) : (
            <div className="subjects-grid">
              {filteredSubjects.map((subject) => (
                <div key={subject._id} className="subject-card">
                  <div className="subject-image-container">
                    <img 
                      src={subject.image.startsWith('/uploads/') 
                        ? `https://lms-f679.onrender.com${subject.image}` 
                        : subject.image} 
                      alt={subject.name} 
                      className="subject-image" 
                    />
                  </div>
                  
                  <div className="subject-card-body">
                    <h3 className="subject-name">{subject.name}</h3>
                    <p className="subject-conductor">
                      Conducted by: <strong>{subject.conductedBy?.name || 'N/A'}</strong>
                    </p>
                    <p className="subject-description">{subject.description}</p>
                  </div>

                  <div className="subject-card-footer">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(subject)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(subject._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
