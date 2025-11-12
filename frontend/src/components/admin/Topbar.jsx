import React from 'react';
import './Topbar.css';
import bellIcon from '../../assets/bell.png';

const Topbar = ({ userName }) => {
  return (
    <div className="topbar">
      <div className="topbar-right">
        <button className="icon-btn">
          <img src={bellIcon} alt="Notifications" className="bell-icon" />
        </button>
        <span className="greeting">Welcome {userName}</span>
        {/* <div className="user-avatar">
          <img src="https://via.placeholder.com/36" alt="User" />
        </div> */}
        {/* <button className="icon-btn">
          <span className="chevron">▼</span>
        </button> */}
      </div>
    </div>
  );
};

export default Topbar;


