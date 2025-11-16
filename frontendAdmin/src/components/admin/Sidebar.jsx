import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import dashboardIcon from '../../assets/dashboard.png';
import employeeIcon from '../../assets/employee.png';
import studentsIcon from '../../assets/students.png';
import subjectsIcon from '../../assets/subjects.png';
import classIcon from '../../assets/class.png';
import expensesIcon from '../../assets/expenses.png';
import salaryIcon from '../../assets/salary.png';
import incomeIcon from '../../assets/income.png';
import extraIncomeIcon from '../../assets/extraincome.png';
import marksIcon from '../../assets/marks.png';
import paymentIcon from '../../assets/payment.png';
import logoutIcon from '../../assets/logout.png';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const allNavItems = [
    { name: "Dashboard", icon: dashboardIcon, path: "/admin/Dashboard" },
    { name: "Employee", icon: employeeIcon, path: "/admin/employee" },
    { name: "Students", icon: studentsIcon, path: "/admin/students" },
    { name: "Subjects", icon: subjectsIcon, path: "/admin/subjects" },
    { name: "Payment", icon: paymentIcon, path: "/admin/payment" },
    { name: "Class", icon: classIcon, path: "/admin/class" },
    { name: "Expenses", icon: expensesIcon, path: "/admin/expenses" },
    { name: "Salary", icon: salaryIcon, path: "/admin/salary" },
    { name: "Extra Income", icon: extraIncomeIcon, path: "/admin/extra-income" },
    { name: "Finance", icon: incomeIcon, path: "/admin/income" },
    { name: "Marks", icon: marksIcon, path: "/admin/marks" },
  ];

  // Get user type and permissions
  const userType = localStorage.getItem('userType');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userPermissions = user.permissions || {};

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => {
    // Admin can see all items
    if (userType === 'admin') {
      return true;
    }
    // Employee can only see items they have permission for
    return userPermissions[item.name] === true;
  });

  useEffect(() => {
    const toggleHandler = () => setIsMobileOpen((prev) => !prev);
    const closeHandler = () => setIsMobileOpen(false);
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileOpen(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('toggle-sidebar', toggleHandler);
    document.addEventListener('close-sidebar', closeHandler);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('toggle-sidebar', toggleHandler);
      document.removeEventListener('close-sidebar', closeHandler);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = (e, item) => {
    e.preventDefault();
    navigate(item.path);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
    setIsMobileOpen(false);
  };

  return (
    <>
      <aside className={`sidebar ${isMobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-text">Learning Platform</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <img src={item.icon} alt={item.name} className="nav-icon" />
              <span className="nav-label">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <img src={logoutIcon} alt="Logout" className="logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />}
    </>
  );
};

export default Sidebar;

