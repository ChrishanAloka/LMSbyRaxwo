import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import './AdminDashboard.css';
import revenueIcon from '../../assets/revenue.png';
import subjectsIcon from '../../assets/subjects (2).png';
import paidIcon from '../../assets/paid.png';
import nonPaidIcon from '../../assets/nonpaid.png';
import employeesIcon from '../../assets/totalemployers.png';
import timeIcon from '../../assets/time.png';
import dateIcon from '../../assets/date.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalSubjects: 0,
    paidStudents: 0,
    unpaidStudents: 0,
    totalEmployees: 0
  });
  const [topCourses, setTopCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const token = useMemo(() => localStorage.getItem('adminToken'), []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const userTypeData = localStorage.getItem('userType');
    let detectedType = null;

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        detectedType = parsedUser?.type || null;
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    if (!detectedType && userTypeData) {
      detectedType = userTypeData;
    }

    if (detectedType === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      navigate('/admin/class', { replace: true });
    }

    setRoleChecked(true);
  }, [navigate]);

  useEffect(() => {
    if (roleChecked && isAdmin) {
      fetchDashboardData();
    }
  }, [roleChecked, isAdmin, selectedMonth]);

  const fetchDashboardData = async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {};

      // Build query parameters for month filter
      const incomeParams = new URLSearchParams();
      const paymentsParams = new URLSearchParams();
      if (selectedMonth) {
        incomeParams.append('months', selectedMonth);
        paymentsParams.append('month', selectedMonth);
      }

      const [
        incomeResponse,
        subjectsResponse,
        studentsResponse,
        employeesResponse,
        classesResponse,
        paymentsResponse
      ] = await Promise.all([
        fetch(`https://lms-f679.onrender.com/api/income/statistics${incomeParams.toString() ? '?' + incomeParams.toString() : ''}`, { headers }),
        fetch('https://lms-f679.onrender.com/api/subjects', { headers }),
        fetch('https://lms-f679.onrender.com/api/students', { headers }),
        fetch('https://lms-f679.onrender.com/api/admin/employees', { headers }),
        fetch('https://lms-f679.onrender.com/api/classes?includeDeleted=false', { headers }),
        fetch(`https://lms-f679.onrender.com/api/payments${paymentsParams.toString() ? '?' + paymentsParams.toString() : ''}`, { headers })
      ]);

      const [
        incomeData,
        subjectsData,
        studentsData,
        employeesData,
        classesData,
        paymentsData
      ] = await Promise.all([
        incomeResponse.json(),
        subjectsResponse.json(),
        studentsResponse.json(),
        employeesResponse.json(),
        classesResponse.json(),
        paymentsResponse.json()
      ]);

      if (!incomeData?.success) {
        throw new Error(incomeData?.message || 'Failed to fetch income statistics');
      }

      if (!subjectsData?.success) {
        throw new Error(subjectsData?.message || 'Failed to fetch subjects');
      }

      if (!studentsData?.success) {
        throw new Error(studentsData?.message || 'Failed to fetch students');
      }

      if (!employeesData?.success) {
        throw new Error(employeesData?.message || 'Failed to fetch employees');
      }

      if (!classesData?.success) {
        throw new Error(classesData?.message || 'Failed to fetch classes');
      }

      if (!paymentsData?.success) {
        throw new Error(paymentsData?.message || 'Failed to fetch payments');
      }

      const subjects = subjectsData.data || [];
      const students = studentsData.data || [];
      const employees = employeesData.data || [];
      const payments = paymentsData.data || [];
      const fetchedClasses = (classesData.data || []).filter(
        (cls) => cls.status === 'ongoing' && !cls.isDeleted
      );

      const paidStudents = students.filter((student) => (student.totalPrice || 0) > 0).length;
      const unpaidStudents = students.length - paidStudents;

      setSummary({
        totalEarnings: incomeData.data?.totalRevenue || 0,
        totalSubjects: subjects.length,
        paidStudents,
        unpaidStudents,
        totalEmployees: employees.length
      });
      setStudentsList(students);

      const subjectLookup = new Map(
        subjects.map((subject) => [subject._id, subject])
      );

      // Calculate top courses based on payment data
      const courseStats = new Map();

      payments.forEach((payment) => {
        (payment.subjects || []).forEach((subjectRef) => {
          const subjectId = typeof subjectRef === 'string' ? subjectRef : subjectRef?._id;
          if (!subjectId) {
            return;
          }

          const subjectInfo =
            (typeof subjectRef === 'object' && subjectRef !== null ? subjectRef : subjectLookup.get(subjectId)) ||
            {};

          const subjectPrice = subjectInfo.price || 0;

          const existing = courseStats.get(subjectId) || {
            id: subjectId,
            name: subjectInfo.name || 'Unknown Subject',
            price: subjectPrice,
            teacher: subjectInfo.conductedBy?.name || subjectInfo.conductedBy || '',
            image: subjectInfo.image || ''
          };

          // Calculate revenue based on subject's actual price
          // Each payment for this subject contributes its price to revenue
          courseStats.set(subjectId, {
            ...existing,
            enrollmentCount: (existing.enrollmentCount || 0) + 1,
            revenue: (existing.revenue || 0) + subjectPrice
          });
        });
      });

      const computedTopCourses = Array.from(courseStats.values())
        .sort((a, b) => {
          // Sort by revenue first, then by enrollment count
          if ((b.revenue || 0) !== (a.revenue || 0)) {
            return (b.revenue || 0) - (a.revenue || 0);
          }
          return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
        })
        .slice(0, 3);

      setTopCourses(computedTopCourses);
      setClasses(fetchedClasses);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const createStudentReport = (students, filename) => {
    if (!studentsList.length) {
      alert('No student data available.');
      return;
    }

    const targetStudents = students(studentsList);

    if (!targetStudents.length) {
      alert('No matching students found for this report.');
      return;
    }

    const headers = ['Student ID', 'Student Name', 'Email', 'Mobile', 'Subjects', 'Payment Type'];
    const rows = targetStudents.map((student) => {
      const subjectNames = Array.isArray(student.subjects)
        ? student.subjects
            .map((subject) =>
              typeof subject === 'object' ? subject.name : subject
            )
            .filter(Boolean)
            .join(', ')
        : '';

      return [
        student.studentId || '',
        student.name || '',
        student.email || '',
        student.mobile || '',
        subjectNames,
        student.paymentType || ''
      ];
    });

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
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadNonPaidReport = () => {
    createStudentReport(
      (students) => students.filter((student) => !student.totalPrice || Number(student.totalPrice) <= 0),
      'non-paid-students'
    );
  };

  const handleDownloadPaidReport = () => {
    createStudentReport(
      (students) => students.filter((student) => Number(student.totalPrice || 0) > 0),
      'paid-students'
    );
  };

  const handleGenerateFilteredReport = () => {
    if (!selectedMonth) {
      alert('Please select a month to generate a filtered report.');
      return;
    }

    // Build report data
    const reportData = [
      ['Dashboard Report - Filtered by Month'],
      [`Month: ${selectedMonth}`],
      [`Generated: ${new Date().toISOString().slice(0, 10)}`],
      [],
      ['Key Metrics'],
      ['Metric', 'Value'],
      ['Total Earnings', `LKR ${formatCurrency(summary.totalEarnings)}`],
      ['Total Subjects', summary.totalSubjects],
      ['Paid Students', summary.paidStudents],
      ['Non-paid Students', summary.unpaidStudents],
      ['Total Employees', summary.totalEmployees],
      [],
      ['Top Selling Courses'],
      ['Course Name', 'Enrollments', 'Price (LKR)', 'Revenue (LKR)'],
      ...topCourses.map((course) => [
        course.name || 'Unknown',
        course.enrollmentCount || 0,
        formatCurrency(course.price || 0),
        formatCurrency(course.revenue || 0)
      ]),
      [],
      ['Payment Statistics'],
      ['Total Revenue from Payments', `LKR ${formatCurrency(chartSegments.total)}`]
    ];

    const csvContent = reportData
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
    const fileName = `dashboard-report-${selectedMonth}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [hourStr, minuteStr] = time.split(':');
    if (!hourStr || !minuteStr) return time;
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, '0');
    const isPM = hour >= 12;
    if (hour === 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }
    return `${hour}:${minute} ${isPM ? 'PM' : 'AM'}`;
  };

  const chartSegments = useMemo(() => {
    if (!topCourses.length) {
      return {
        background: '#E5E7EB',
        total: 0
      };
    }

    const totalRevenue = topCourses.reduce((sum, course) => sum + (course.revenue || 0), 0);

    if (totalRevenue === 0) {
      return {
        background: '#E5E7EB',
        total: 0
      };
    }

    const palette = ['#6C5CE7', '#00B894', '#0984E3'];
    const segments = [];
    let currentPercent = 0;

    topCourses.forEach((course, index) => {
      const share = ((course.revenue || 0) / totalRevenue) * 100;
      const endPercent = currentPercent + share;
      const color = palette[index % palette.length];
      segments.push(`${color} ${currentPercent}% ${endPercent}%`);
      currentPercent = endPercent;
    });

    if (currentPercent < 100) {
      segments.push(`#E5E7EB ${currentPercent}% 100%`);
    }

    return {
      background: `conic-gradient(${segments.join(', ')})`,
      total: totalRevenue
    };
  }, [topCourses]);

  const metricCards = [
    {
      id: 'total-earnings',
      label: 'Total Earnings',
      value: `LKR ${formatCurrency(summary.totalEarnings)}`,
      icon: revenueIcon,
      accent: 'metric-card-positive'
    },
    {
      id: 'total-subjects',
      label: 'Total Subjects',
      value: summary.totalSubjects,
      icon: subjectsIcon,
      accent: 'metric-card-neutral'
    },
    {
      id: 'paid-students',
      label: 'Paid Students',
      value: summary.paidStudents,
      icon: paidIcon,
      accent: 'metric-card-positive'
    },
    {
      id: 'unpaid-students',
      label: 'Non-paid Students',
      value: summary.unpaidStudents,
      icon: nonPaidIcon,
      accent: 'metric-card-warning'
    },
    {
      id: 'total-employees',
      label: 'Total Employees',
      value: summary.totalEmployees,
      icon: employeesIcon,
      accent: 'metric-card-neutral'
    }
  ];

  const renderClassCard = (classItem) => {
    const subject = classItem.subjectId || {};
    const teacher = classItem.teacherId || {};
    const date = classItem.date ? new Date(classItem.date) : null;

    const monthLabel = date
      ? date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
      : '';
    const dayLabel = date ? String(date.getDate()).padStart(2, '0') : '';

    const imageUrl = subject.image
      ? subject.image.startsWith('/uploads/')
        ? `https://lms-f679.onrender.com${subject.image}`
        : subject.image
      : 'https://via.placeholder.com/300x200?text=Class+Image';

    return (
      <div key={classItem._id} className="ongoing-class-card">
        <div className="ongoing-class-image-wrapper">
          <img src={imageUrl} alt={subject.name || 'Class'} className="ongoing-class-image" />
          {(monthLabel || dayLabel) && (
            <div className="ongoing-class-date">
              <span className="ongoing-class-month">{monthLabel}</span>
              <span className="ongoing-class-day">{dayLabel}</span>
            </div>
          )}
        </div>
        <div className="ongoing-class-content">
          <h3 className="ongoing-class-title">{subject.name || 'Untitled Class'}</h3>
          <p className="ongoing-class-description">
            {subject.description ? subject.description.slice(0, 80) + (subject.description.length > 80 ? '…' : '') : 'No description available.'}
          </p>
          <div className="ongoing-class-meta">
            <div className="ongoing-class-meta-item">
              <img src={timeIcon} alt="" />
              <span>{formatTime(classItem.time)}</span>
            </div>
            <div className="ongoing-class-meta-item">
              <img src={dateIcon} alt="" />
              <span>{teacher.name || 'Unknown Teacher'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!roleChecked || !isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="admin-main-content">
        <Topbar userName="Admin" />
        <div className="admin-content">
          <div className="admin-header-row">
            <h1>Dashboard Overview</h1>
            <div className="dashboard-header-actions">
              <button
                type="button"
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Filter'}
              </button>
              {selectedMonth && (
                <>
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={() => setSelectedMonth('')}
                  >
                    Clear Filter
                  </button>
                  <button
                    type="button"
                    className="filtered-report-btn"
                    onClick={handleGenerateFilteredReport}
                  >
                    Generate Filtered Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Month Filter Section */}
          {showFilters && (
            <div className="filter-section">
              <div className="filter-group">
                <label>Select Month</label>
                <div className="month-select-wrapper">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="month-select"
                  >
                    <option value="">All Months</option>
                    {months.map((month, index) => (
                      <option key={index} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  {selectedMonth && (
                    <div className="selected-month-info">
                      <span>Filtered by: {selectedMonth}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="admin-error-banner">
              <p>{error}</p>
            </div>
          )}

          <section className="admin-section">
            <h2 className="section-title">Key Metrics</h2>
            <div className="metrics-grid">
              {metricCards.map((card) => {
                const isNonPaidCard = card.id === 'unpaid-students';
                const handleClick = isNonPaidCard ? handleDownloadNonPaidReport : undefined;
                const handleKeyPress = (event) => {
                  if (!isNonPaidCard) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleDownloadNonPaidReport();
                  }
                };

                const isPaidCard = card.id === 'paid-students';

                return (
                  <div
                    key={card.id}
                    className={`metric-card ${card.accent} ${
                      isNonPaidCard || isPaidCard ? 'metric-card-clickable' : ''
                    }`}
                    onClick={
                      isNonPaidCard
                        ? handleDownloadNonPaidReport
                        : isPaidCard
                          ? handleDownloadPaidReport
                          : undefined
                    }
                    onKeyDown={(event) => {
                      if (!(isNonPaidCard || isPaidCard)) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        if (isNonPaidCard) {
                          handleDownloadNonPaidReport();
                        } else if (isPaidCard) {
                          handleDownloadPaidReport();
                        }
                      }
                    }}
                    role={isNonPaidCard || isPaidCard ? 'button' : undefined}
                    tabIndex={isNonPaidCard || isPaidCard ? 0 : undefined}
                    aria-label={
                      isNonPaidCard
                        ? 'Download report of non-paid students'
                        : isPaidCard
                          ? 'Download report of paid students'
                          : undefined
                    }
                  >
                    <div className="metric-icon">
                      <img src={card.icon} alt="" />
                    </div>
                    <div className="metric-details">
                      <p className="metric-label">{card.label}</p>
                      <p className="metric-value">{card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="admin-middle-row">
            <section className="admin-section top-courses-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Top Selling Courses</h2>
                  <p className="section-subtitle">Based on student enrollments</p>
                </div>
              </div>

              {topCourses.length ? (
                <div className="top-courses-content">
                  <div
                    className="top-courses-chart"
                    style={{ background: chartSegments.background }}
                  >
                    <div className="top-courses-chart-inner">
                      <p className="chart-total-label">Total</p>
                      <p className="chart-total-value">
                        LKR {formatCurrency(chartSegments.total)}
                      </p>
                    </div>
                  </div>

                  <div className="top-courses-list">
                    {topCourses.map((course, index) => {
                      const palette = ['#6C5CE7', '#00B894', '#0984E3'];
                      const color = palette[index % palette.length];
                      return (
                        <div key={course.id} className="top-course-item">
                          <span
                            className="top-course-indicator"
                            style={{ backgroundColor: color }}
                          />
                          <div className="top-course-details">
                            <p className="top-course-name">{course.name}</p>
                            <p className="top-course-meta">
                              {course.enrollmentCount || 0} enrollment
                              {(course.enrollmentCount || 0) === 1 ? '' : 's'}
                            </p>
                          </div>
                          <p className="top-course-price">
                            LKR {formatCurrency(course.price || 0)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>{loading ? 'Loading chart…' : 'No enrollment data available yet.'}</p>
                </div>
              )}
            </section>

            <section className="admin-section ongoing-classes-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Ongoing Classes</h2>
                  <p className="section-subtitle">Classes that teachers are currently running</p>
                </div>
                <button
                  type="button"
                  className="view-classes-link"
                  onClick={() => navigate('/admin/classes/view')}
                >
                  View All
                </button>
              </div>

              {classes.length ? (
                <div className="ongoing-classes-grid">
                  {classes.slice(0, 4).map((classItem) => renderClassCard(classItem))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>{loading ? 'Loading classes…' : 'No ongoing classes at the moment.'}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
