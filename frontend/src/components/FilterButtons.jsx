import React from 'react';
import './FilterButtons.css';

const FilterButtons = ({ categories = [], activeCategory = "All Courses", onFilterChange }) => {
  return (
    <div className="filter-buttons">
      {categories.map((category, index) => (
        <button
          key={index}
          className={`filter-btn ${category === activeCategory ? 'active' : ''}`}
          onClick={() => onFilterChange && onFilterChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default FilterButtons;


