import React from 'react';
import './CourseCard.css';

const CourseCard = ({ 
  course = {
    id: 1,
    name: "Course Title",
    title: "Course Title", // Keep for backward compatibility
    description: "Course description goes here...",
    price: 60,
    image: "/placeholder-course.jpg",
    teacher: "Teacher Name",
    featured: false
  }
}) => {
  const courseTitle = course.name || course.title;
  
  return (
    <div className="course-card">
      <div className="course-image-container">
        <img 
          src={
            course.image
              ? (course.image.startsWith('/uploads/') 
                  ? `https://lms-f679.onrender.com${course.image}` 
                  : course.image)
              : "https://via.placeholder.com/300x200?text=Course+Image"
          }
          alt={courseTitle} 
          className="course-image" 
        />
        <div className="price-badge">LKR {course.price}</div>
      </div>

      <div className="course-content">
        <h3 className="course-title">{courseTitle}</h3>
        {(course.teacher || course.conductedBy) && (
          <p className="course-teacher">
            <span className="teacher-label">Conducted by:</span>
            <span className="teacher-name">{course.teacher || course.conductedBy?.name || course.conductedBy}</span>
          </p>
        )}
        <p className="course-description">{course.description}</p>
{/* 
        <button className={`purchase-btn ${course.featured ? 'featured' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          Purchase Course
        </button> */}
      </div>
    </div>
  );
};

export default CourseCard;

