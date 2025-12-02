import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logo from '../assets/logo.png';

const Header = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      // Navigate to courses page if not already there
      if (window.location.pathname !== '/courses') {
        navigate('/courses');
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Clear search if input is empty
    if (e.target.value.trim() === '') {
      onSearch('');
    }
  };

  const handleLogoClick = () => {
    navigate('/courses');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={handleLogoClick}>
          <img src={logo} alt="Wisdom Institute Logo" className="logo-image" />
          <span className="logo-text">WISDOM INSTITUTE</span>
        </div>

        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>

        
      </div>
    </header>
  );
};

export default Header;

