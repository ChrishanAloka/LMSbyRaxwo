import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import CourseCard from '../../components/CourseCard';
import FilterButtons from '../../components/FilterButtons';
import API_CONFIG from '../../config/api';
import './CoursesPage.css';

const CoursesPage = () => {
  const [activeFilter, setActiveFilter] = useState('All Courses');
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [categories, setCategories] = useState(['All Courses']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
        // Extract unique categories from subjects
        const uniqueCategories = ['All Courses', ...new Set(data.data.map(s => s.category))];
        setCategories(uniqueCategories);
      } else {
        setCourses([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, activeFilter]);

  const filterCourses = () => {
    let filtered = [...courses];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (activeFilter !== 'All Courses') {
      filtered = filtered.filter(course => course.category === activeFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="courses-page">
      <Header onSearch={handleSearch} />
      
      <main className="courses-main">
        <div className="hero-section">
          <h1 className="hero-title">Courses</h1>
          <p className="hero-description">
            You can get registered and start learning these courses.
          </p>
          
          <div className="filter-section">
            <FilterButtons 
              categories={categories} 
              activeCategory={activeFilter}
              onFilterChange={setActiveFilter}
            />
            <button className="attempt-class-btn" onClick={() => navigate('/classes')}>
              Attemp Class
            </button>
            <button className="attempt-class-btn" onClick={() => navigate('/exam-registration')}>
              Exam Registration
            </button>
          </div>
        </div>

        {loading ? (
          <div className="courses-empty">
            <p>Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="courses-empty">
            <p>
              {searchQuery.trim() 
                ? `No courses found matching "${searchQuery}". Try a different search term.`
                : 'No courses available at the moment. Please check back later.'
              }
            </p>
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map(course => (
              <CourseCard key={course._id || course.id || course.name} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursesPage;

