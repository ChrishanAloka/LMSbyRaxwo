import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import './ExtraIncomePage.css';

const API_BASE = `${API_CONFIG.API_URL}/extra-income`;

const monthOptions = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const defaultForm = { title: '', description: '', amount: '', year: '', month: '' };

const ExtraIncomePage = () => {
  const [extraIncomes, setExtraIncomes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchExtraIncomes();
  }, [selectedMonths]);

  const fetchExtraIncomes = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedMonths.length > 0) {
        params.append('months', selectedMonths.join(','));
      }

      const url = `${API_BASE}${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setExtraIncomes(data.data);
    } catch (err) {
      console.error('Error fetching extra income:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, amount, year, month } = formData;
    if (!title || !amount || !year || !month) {
      setError('Please fill all required fields (title, amount, year, month).');
      return;
    }
    
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ title, description, amount, year, month })
        });
        const data = await res.json();
        if (data.success) {
          await fetchExtraIncomes();
          setFormData(defaultForm);
          setEditingId('');
          setShowForm(false);
        } else {
          setError(data.message || 'Failed to update extra income');
        }
      } else {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ title, description, amount, year, month })
        });
        const data = await res.json();
        if (data.success) {
          await fetchExtraIncomes();
          setFormData(defaultForm);
          setShowForm(false);
        } else {
          setError(data.message || 'Failed to add extra income');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this extra income record?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await fetchExtraIncomes();
      } else {
        alert(data.message || 'Failed to delete extra income');
      }
    } catch (err) {
      console.error('Error deleting extra income:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleEdit = (extraIncome) => {
    setFormData({ 
      title: extraIncome.title || '', 
      description: extraIncome.description || '', 
      amount: String(extraIncome.amount || ''), 
      year: extraIncome.year || '', 
      month: extraIncome.month || '' 
    });
    setEditingId(extraIncome._id);
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setFormData(defaultForm);
    setEditingId('');
    setShowForm(false);
    setError('');
  };

  const handleMonthToggle = (month) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedMonths([]);
  };

  const filteredExtraIncomes = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let filtered = extraIncomes;
    
    // Apply search term filter
    if (term) {
      filtered = filtered.filter((item) =>
        [
          item.title,
          item.description,
          item.year?.toString(),
          item.month,
          item.amount?.toString()
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [extraIncomes, searchTerm]);

  const totalAmount = React.useMemo(() => {
    return filteredExtraIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExtraIncomes]);

  const handleGenerateReport = () => {
    if (!filteredExtraIncomes.length) {
      alert('No extra income records available to generate a report.');
      return;
    }

    const headers = [
      'Title',
      'Description',
      'Amount (LKR)',
      'Year',
      'Month'
    ];

    const rows = filteredExtraIncomes.map((item) => [
      item.title || '',
      item.description || '',
      item.amount ?? 0,
      item.year || '',
      item.month || ''
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
    link.download = `extra-income-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateFilteredReport = () => {
    if (selectedMonths.length === 0) {
      alert('Please select at least one month to generate a filtered report.');
      return;
    }

    if (!filteredExtraIncomes.length) {
      alert('No extra income records available to generate a report.');
      return;
    }

    // Build filter info for report
    const filterText = `\nFiltered by: Months: ${selectedMonths.join(', ')}\n`;

    const headers = [
      'Title',
      'Description',
      'Amount (LKR)',
      'Year',
      'Month'
    ];

    const rows = filteredExtraIncomes.map((item) => [
      item.title || '',
      item.description || '',
      item.amount ?? 0,
      item.year || '',
      item.month || ''
    ]);

    const csvContent = [
      `Extra Income Report - Filtered by Month(s) - ${new Date().toISOString().slice(0, 10)}${filterText}`,
      ...headers,
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `extra-income-report-filtered-${selectedMonths.join('-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="extra-income-page">
      <Sidebar />
      <div className="extra-income-main-content">
        <Topbar userName="Admin" />
        
        <div className="extra-income-content">
          <div className="extra-income-header">
            <h1>Extra Income</h1>
            <div className="extra-income-header-actions">
              <div className="extra-income-search">
                <input
                  type="text"
                  placeholder="Search by title, month, Des."
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
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Filter'}
              </button>
              <button
                type="button"
                className="report-btn"
                onClick={handleGenerateReport}
                disabled={filteredExtraIncomes.length === 0}
              >
                Generate Report
              </button>
              {selectedMonths.length > 0 && (
                <button
                  type="button"
                  className="filtered-report-btn"
                  onClick={handleGenerateFilteredReport}
                  disabled={filteredExtraIncomes.length === 0}
                >
                  Generate Filtered Report
                </button>
              )}
              <button 
                className="add-extra-income-btn" 
                onClick={() => {
                  if (showForm) {
                    handleCancel();
                  } else {
                    setShowForm(true);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Add Extra Income'}
              </button>
            </div>
          </div>

          {/* Month Filter Section */}
          {showFilters && (
            <div className="filter-section">
              <div className="filter-header-row">
                {selectedMonths.length > 0 && (
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="filter-group">
                <label>Select Month(s)</label>
                <div className="months-filter">
                  <div className="months-checkbox-grid">
                    {monthOptions.map((month, index) => (
                      <label key={index} className="month-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedMonths.includes(month)}
                          onChange={() => handleMonthToggle(month)}
                        />
                        <span>{month}</span>
                      </label>
                    ))}
                  </div>
                  {selectedMonths.length > 0 && (
                    <div className="selected-months-info">
                      <span>{selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''} selected: {selectedMonths.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="extra-income-form-container">
              <h2>{editingId ? 'Edit Extra Income' : 'Add Extra Income'}</h2>
              <form onSubmit={handleSubmit} className="extra-income-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Title <span className="required">*</span></label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter income title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="amount">Amount (LKR) <span className="required">*</span></label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description (Optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter description"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="year">Year <span className="required">*</span></label>
                    <input
                      type="text"
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="e.g., 2024"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="month">Month <span className="required">*</span></label>
                    <select
                      id="month"
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Month</option>
                      {monthOptions.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading 
                      ? (editingId ? 'Updating...' : 'Adding...') 
                      : (editingId ? 'Update' : 'Add Extra Income')
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="extra-income-table">
            {extraIncomes.length === 0 ? (
              <div className="empty-state">
                <p>No extra income records added yet. Click "Add Extra Income" to get started.</p>
              </div>
            ) : filteredExtraIncomes.length === 0 ? (
              <div className="empty-state">
                <p>No extra income records match your search.</p>
              </div>
            ) : (
              <>
                <div className="total-display">
                  <strong>Total Extra Income: LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Year</th>
                      <th>Month</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExtraIncomes.map((item) => (
                      <tr key={item._id}>
                        <td>{item.title}</td>
                        <td>{item.description || '-'}</td>
                        <td>LKR {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{item.year}</td>
                        <td>{item.month}</td>
                        <td>
                          <button 
                            className="edit-btn"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(item._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtraIncomePage;

