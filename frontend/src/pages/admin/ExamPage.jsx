import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import './ExamPage.css';

const ExamPage = () => {
  const [examRecords, setExamRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [validatedStudent, setValidatedStudent] = useState(null);
  const [validatingStudent, setValidatingStudent] = useState(false);
  const [studentValidationError, setStudentValidationError] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [formData, setFormData] = useState({
    exam: '',
    examDate: '',
    title: '',
    otherNames: '',
    familyName: '',
    email: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    telephone: '',
    mobile: '',
    specialNeeds: '',
    specialNeedsDetails: '',
    guardianFirstName: '',
    guardianLastName: '',
    guardianTelephone: '',
    guardianMobile: '',
    ukVisa: '',
    candidateIdNumber: ''
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate exam report (CSV) - will use filteredExams defined below
  const handleGenerateReport = () => {
    if (!examRecords || examRecords.length === 0) {
      alert('No exam records available to generate a report.');
      return;
    }

    // Filter exams for report (same logic as filteredExams)
    const examsToReport = examRecords.filter((exam) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const studentId = exam.studentIdNumber || (exam.studentId?.studentId || '');
      const studentName = exam.studentId?.name || '';
      return (
        studentId.toLowerCase().includes(term) ||
        studentName.toLowerCase().includes(term) ||
        (exam.ukVisa || '').toLowerCase().includes(term) ||
        (exam.exams && Array.isArray(exam.exams) && exam.exams.some(ex => {
          const subjectName = typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || '';
          return subjectName.toLowerCase().includes(term);
        })) ||
        (exam.exam || '').toLowerCase().includes(term) ||
        (exam.candidateIdNumber || '').toLowerCase().includes(term)
      );
    });

    if (examsToReport.length === 0) {
      alert('No exam records match your search criteria.');
      return;
    }

    // Create CSV content - columns ordered to match the table
    const headers = [
      'Student ID',
      'Exam',
      'Exam Date',
      'Title',
      'Other Names',
      'Family Name',
      'Email',
      'Day',
      'Month',
      'Year',
      'Gender',
      'Telephone',
      'Mobile',
      'Special Needs',
      'Special Needs Details',
      'Guardian FirstName',
      'Guardian LastName',
      'Guardian Telephone',
      'Guardian Mobile',
      'For Uk Visa',
      'Candidate ID Number'
    ];

    const rows = examsToReport.map((exam) => {
      // Format exams list
      let examsList = '';
      if (exam.exams && Array.isArray(exam.exams) && exam.exams.length > 0) {
        examsList = exam.exams.map((ex) => {
          const subjectName = typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || '';
          return subjectName;
        }).join(', ');
      } else if (exam.exam) {
        examsList = exam.exam;
      }

      // derive day/month/year if provided as separate fields or from dateOfBirth
      let day = exam.birthDay || '';
      let month = exam.birthMonth || '';
      let year = exam.birthYear || '';
      if ((!day || !month || !year) && exam.dateOfBirth) {
        const dob = new Date(exam.dateOfBirth);
        day = day || dob.getDate().toString();
        month = month || (dob.getMonth() + 1).toString();
        year = year || dob.getFullYear().toString();
      }

      return [
        exam.studentIdNumber || exam.studentId?.studentId || 'N/A',
        examsList || 'N/A',
        exam.examDate ? (formatDate(exam.examDate) || 'N/A') : 'N/A',
        exam.title || 'N/A',
        exam.otherNames || exam.firstName || 'N/A',
        exam.familyName || exam.lastName || 'N/A',
        exam.email || exam.studentId?.email || 'N/A',
        day || 'N/A',
        month || 'N/A',
        year || 'N/A',
        exam.gender || exam.studentId?.gender || 'N/A',
        exam.telephone || 'N/A',
        exam.mobile || exam.studentId?.mobile || 'N/A',
        exam.specialNeeds || exam.studentId?.specialNeed || 'N/A',
        exam.specialNeedsDetails || exam.studentId?.specialNeedsDetails || 'N/A',
        exam.guardianFirstName || exam.studentId?.guardianFirstName || 'N/A',
        exam.guardianLastName || exam.studentId?.guardianLastName || 'N/A',
        exam.guardianTelephone || exam.studentId?.guardianTelephone || 'N/A',
        exam.guardianMobile || 'N/A',
        exam.ukVisa || 'N/A',
        exam.candidateIdNumber || 'N/A'
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
    link.download = `exam-records-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Admin';

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const subjects = data.data.map(sub => ({
          id: sub._id,
          name: sub.name
        }));
        setAvailableSubjects(subjects);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/exams`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setExamRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  // Fetch all students on mount for autocomplete
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const response = await fetch(`${API_CONFIG.API_URL}/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setAllStudents(data.data);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };
    fetchAllStudents();
  }, []);

  // Get student suggestions based on search input
  const getStudentSuggestions = (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const suggestions = [];

    allStudents.forEach(student => {
      const studentName = (student.name || '').trim().toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      
      // Check if search matches student ID
      if (studentId.includes(searchLower)) {
        suggestions.push({
          ...student,
          matchType: 'ID',
          displayText: `${student.name} (ID: ${student.studentId})`
        });
        return;
      }

      // Split student's full name into parts
      const nameParts = studentName.split(/\s+/).filter(part => part.length > 0);
      const firstName = nameParts.length > 0 ? nameParts[0] : '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      const fullName = studentName;

      // Check if search matches first name, last name, or full name (partial match)
      const matchesFirstName = firstName && firstName.startsWith(searchLower);
      const matchesLastName = lastName && lastName.startsWith(searchLower);
      const matchesFullName = fullName.includes(searchLower);
      
      // Check if search matches any part of the name
      const matchesAnyPart = nameParts.some(part => part.startsWith(searchLower));

      if (matchesFirstName || matchesLastName || matchesFullName || matchesAnyPart) {
        suggestions.push({
          ...student,
          matchType: 'Name',
          displayText: `${student.name} (ID: ${student.studentId})`
        });
      }
    });

    // Sort: exact ID matches first, then name matches
    return suggestions.sort((a, b) => {
      if (a.matchType === 'ID' && b.matchType !== 'ID') return -1;
      if (a.matchType !== 'ID' && b.matchType === 'ID') return 1;
      return a.name.localeCompare(b.name);
    }).slice(0, 10); // Limit to 10 suggestions
  };

  const handleStudentSearchChange = (e) => {
    const searchTerm = e.target.value;
    setStudentIdInput(searchTerm);
    
    if (searchTerm.trim()) {
      const suggestions = getStudentSuggestions(searchTerm);
      setStudentSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }

    setValidatedStudent(null);
    setStudentValidationError('');
  };

  const handleStudentSuggestionSelect = (student) => {
    setStudentIdInput(`${student.name} (ID: ${student.studentId})`);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setValidatedStudent(student);
    setStudentValidationError('');
    setShowForm(true);
    // Pre-fill form with student data
    const nameParts = (student.name || '').trim().split(/\s+/);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');
    
    // Extract date of birth components
    let birthDay = '', birthMonth = '', birthYear = '';
    if (student.birthday) {
      const dob = new Date(student.birthday);
      birthDay = dob.getDate().toString();
      birthMonth = (dob.getMonth() + 1).toString();
      birthYear = dob.getFullYear().toString();
    }
    
    // Format mobile number for display
    let mobileDisplay = '';
    if (student.mobile) {
      let mobile = student.mobile;
      if (mobile.startsWith('+94')) {
        mobile = mobile.substring(3);
      } else if (mobile.startsWith('0')) {
        mobile = mobile.substring(1);
      }
      mobileDisplay = mobile.replace(/\D/g, '');
    }
    
    setFormData({
      exam: '',
      examDate: '',
      title: student.title || '',
      otherNames: firstName,
      familyName: lastName,
      email: student.email || '',
      birthDay: birthDay,
      birthMonth: birthMonth,
      birthYear: birthYear,
      gender: student.gender || '',
      telephone: '',
      mobile: mobileDisplay,
      specialNeeds: student.hasSpecialNeeds ? 'Yes' : 'No',
      specialNeedsDetails: student.specialNeedsDetails || '',
      guardianFirstName: student.guardianFirstName || '',
      guardianLastName: student.guardianLastName || '',
      guardianTelephone: student.guardianTelephone || '',
      guardianMobile: '',
      ukVisa: '',
      candidateIdNumber: ''
    });
  };

  const validateStudentId = async () => {
    if (!studentIdInput.trim()) {
      setStudentValidationError('Please enter a Student ID, first name, last name, or full name');
      return;
    }

    // If student is already selected from suggestions, skip validation
    if (validatedStudent) {
      return;
    }

    setValidatingStudent(true);
    setStudentValidationError('');
    setValidatedStudent(null);

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const searchTerm = studentIdInput.trim();
        // Try to find student by ID first
        let student = data.data.find(s => s.studentId === searchTerm);
        
        // If not found by ID, try searching by name (first name, last name, or full name)
        if (!student) {
          student = data.data.find(s => {
            const studentName = (s.name || '').trim().toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            
            // Split student's full name into parts
            const nameParts = studentName.split(/\s+/).filter(part => part.length > 0);
            const firstName = nameParts.length > 0 ? nameParts[0] : '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            // Check if search term matches first name, last name, or full name
            const matchesFirstName = firstName && searchLower === firstName;
            const matchesLastName = lastName && searchLower === lastName;
            const matchesFullName = searchLower === studentName;
            
            // Also check if search term matches reversed full name (e.g., "Last First" matches "First Last")
            const searchParts = searchLower.split(/\s+/).filter(part => part.length > 0);
            const matchesReversed = searchParts.length === nameParts.length && 
              searchParts.length === 2 &&
              searchParts[0] === nameParts[1] && 
              searchParts[1] === nameParts[0];
            
            return matchesFirstName || matchesLastName || matchesFullName || matchesReversed;
          });
        }
        
        if (student) {
          setValidatedStudent(student);
          setStudentValidationError('');
          setShowForm(true);
          // Pre-fill form with student data
          const nameParts = (student.name || '').trim().split(/\s+/);
          const firstName = nameParts.shift() || '';
          const lastName = nameParts.join(' ');
          
          // Extract date of birth components
          let birthDay = '', birthMonth = '', birthYear = '';
          if (student.birthday) {
            const dob = new Date(student.birthday);
            birthDay = dob.getDate().toString();
            birthMonth = (dob.getMonth() + 1).toString();
            birthYear = dob.getFullYear().toString();
          }
          
          // Format mobile number for display
          let mobileDisplay = '';
          if (student.mobile) {
            let mobile = student.mobile;
            if (mobile.startsWith('+94')) {
              mobile = mobile.substring(3);
            } else if (mobile.startsWith('0')) {
              mobile = mobile.substring(1);
            }
            mobileDisplay = mobile.replace(/\D/g, '');
          }
          
          setFormData({
            exam: '',
            examDate: '',
            title: '',
            otherNames: firstName,
            familyName: lastName,
            email: student.email || '',
            birthDay: birthDay,
            birthMonth: birthMonth,
            birthYear: birthYear,
            gender: student.gender || '',
            telephone: '',
            mobile: mobileDisplay,
            specialNeeds: student.specialNeed || '',
            specialNeedsDetails: student.specialNeedsDetails || '',
            guardianFirstName: student.guardianFirstName || '',
            guardianLastName: student.guardianLastName || '',
            guardianTelephone: (() => {
              let tel = student.guardianTelephone || '';
              if (tel) {
                if (tel.startsWith('+94')) tel = tel.substring(3);
                else if (tel.startsWith('0')) tel = tel.substring(1);
                tel = tel.replace(/\D/g, '');
              }
              return tel;
            })(),
            guardianMobile: '',
            ukVisa: '',
            candidateIdNumber: ''
          });
        } else {
          setStudentValidationError('Student not found. Please enter a valid Student ID, first name, last name, or full name.');
          setValidatedStudent(null);
        }
      } else {
        setStudentValidationError('Error validating student ID');
      }
    } catch (err) {
      console.error('Error validating student:', err);
      setStudentValidationError('Network error. Please try again.');
    } finally {
      setValidatingStudent(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  // Handle mobile number input with +94 prefix
  const handleMobileChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d+]/g, '');
    if (value.startsWith('+94')) {
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      value = value.substring(1);
    }
    value = value.replace(/\D/g, '');
    setFormData({
      ...formData,
      mobile: value
    });
    setError('');
  };

  // Handle telephone number input with +94 prefix
  const handleTelephoneChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d+]/g, '');
    if (value.startsWith('+94')) {
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      value = value.substring(1);
    }
    value = value.replace(/\D/g, '');
    setFormData({
      ...formData,
      telephone: value
    });
    setError('');
  };

  // Handle guardian telephone number input with +94 prefix
  const handleGuardianTelephoneChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d+]/g, '');
    if (value.startsWith('+94')) {
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      value = value.substring(1);
    }
    value = value.replace(/\D/g, '');
    setFormData({
      ...formData,
      guardianTelephone: value
    });
    setError('');
  };

  // Handle guardian mobile number input with +94 prefix
  const handleGuardianMobileChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d+]/g, '');
    if (value.startsWith('+94')) {
      value = value.substring(3);
    } else if (value.startsWith('0')) {
      value = value.substring(1);
    }
    value = value.replace(/\D/g, '');
    setFormData({
      ...formData,
      guardianMobile: value
    });
    setError('');
  };

  const handleExamSelect = (e) => {
    const selectedSubjectId = e.target.value;
    setFormData({
      ...formData,
      exam: selectedSubjectId
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!validatedStudent) {
      setError('Please validate student ID first');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.exam) {
      setError('Please select an exam');
      setLoading(false);
      return;
    }


    if (!formData.title.trim()) {
      setError('Please enter title');
      setLoading(false);
      return;
    }

    if (!formData.familyName.trim()) {
      setError('Please enter family name');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter email address');
      setLoading(false);
      return;
    }

    if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
      setError('Please enter complete date of birth (Day, Month, Year)');
      setLoading(false);
      return;
    }

    if (!formData.gender) {
      setError('Please select gender');
      setLoading(false);
      return;
    }

    if (!formData.mobile.trim()) {
      setError('Please enter mobile number');
      setLoading(false);
      return;
    }

    // Format mobile numbers with +94 prefix
    let formattedMobile = (formData.mobile || '').trim();
    if (formattedMobile) {
      formattedMobile = formattedMobile.replace(/\D/g, '');
      if (formattedMobile.startsWith('0')) {
        formattedMobile = formattedMobile.substring(1);
      }
      formattedMobile = '+94' + formattedMobile;
    }

    let formattedTelephone = (formData.telephone || '').trim();
    if (formattedTelephone) {
      formattedTelephone = formattedTelephone.replace(/\D/g, '');
      if (formattedTelephone.startsWith('0')) {
        formattedTelephone = formattedTelephone.substring(1);
      }
      formattedTelephone = '+94' + formattedTelephone;
    }

    let formattedGuardianTelephone = (formData.guardianTelephone || '').trim();
    if (formattedGuardianTelephone) {
      formattedGuardianTelephone = formattedGuardianTelephone.replace(/\D/g, '');
      if (formattedGuardianTelephone.startsWith('0')) {
        formattedGuardianTelephone = formattedGuardianTelephone.substring(1);
      }
      formattedGuardianTelephone = '+94' + formattedGuardianTelephone;
    }

    let formattedGuardianMobile = (formData.guardianMobile || '').trim();
    if (formattedGuardianMobile) {
      formattedGuardianMobile = formattedGuardianMobile.replace(/\D/g, '');
      if (formattedGuardianMobile.startsWith('0')) {
        formattedGuardianMobile = formattedGuardianMobile.substring(1);
      }
      formattedGuardianMobile = '+94' + formattedGuardianMobile;
    }

    // Convert single exam to exams array format for backend
    const selectedSubject = availableSubjects.find(sub => sub.id === formData.exam);
    const examsArray = selectedSubject ? [{
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name
    }] : [];

    // Build date of birth from day, month, year
    const dateOfBirth = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;

    try {
      const url = editingExam
        ? `${API_CONFIG.API_URL}/exams/${editingExam._id}`
        : `${API_CONFIG.API_URL}/exams`;
      
      const method = editingExam ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: validatedStudent._id,
          studentIdNumber: validatedStudent.studentId,
          firstName: formData.otherNames.trim(),
          lastName: formData.familyName.trim(),
          title: formData.title.trim(),
          otherNames: formData.otherNames.trim(),
          familyName: formData.familyName.trim(),
          email: formData.email.trim(),
          dateOfBirth: dateOfBirth,
          birthDay: formData.birthDay,
          birthMonth: formData.birthMonth,
          birthYear: formData.birthYear,
          gender: formData.gender,
          telephone: formattedTelephone || undefined,
          mobile: formattedMobile,
          specialNeeds: formData.specialNeeds.trim() || undefined,
          specialNeedsDetails: formData.specialNeedsDetails.trim() || undefined,
          guardianFirstName: formData.guardianFirstName.trim() || undefined,
          guardianLastName: formData.guardianLastName.trim() || undefined,
          guardianTelephone: formattedGuardianTelephone || undefined,
          guardianMobile: formattedGuardianMobile || undefined,
          ukVisa: formData.ukVisa.trim() || undefined,
          exams: examsArray,
          candidateIdNumber: formData.candidateIdNumber.trim() || undefined,
          examDate: formData.examDate || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(editingExam ? 'Exam record updated successfully!' : 'Exam record created successfully!');
        // Refresh exam records to show the newly created/updated record (shared with client)
        await fetchExams();
        handleReset();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Check if error is due to existing record
        if (data.exists && data.data) {
          setError('Exam record already exists for this student. Please check the records below.');
          setTimeout(() => setError(''), 5000);
          // Refresh to show the existing record
          await fetchExams();
        } else {
          setError(data.message || `Failed to ${editingExam ? 'update' : 'create'} exam record`);
        }
      }
    } catch (err) {
      console.error('Error saving exam:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentIdInput('');
    setValidatedStudent(null);
    setFormData({
      exam: '',
      examDate: '',
      title: '',
      otherNames: '',
      familyName: '',
      email: '',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      gender: '',
      telephone: '',
      mobile: '',
      specialNeeds: '',
      specialNeedsDetails: '',
      guardianFirstName: '',
      guardianLastName: '',
      guardianTelephone: '',
      guardianMobile: '',
      ukVisa: '',
      candidateIdNumber: ''
    });
    setShowForm(false);
    setEditingExam(null);
    setError('');
    setStudentValidationError('');
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setStudentIdInput(exam.studentIdNumber || (exam.studentId?.studentId || ''));
    setValidatedStudent(exam.studentId || null);
    
    // Format exam date for input field (YYYY-MM-DD format)
    let examDateFormatted = '';
    if (exam.examDate) {
      const date = new Date(exam.examDate);
      examDateFormatted = date.toISOString().split('T')[0];
    }
    
    // Get exam subject ID (use first exam if multiple)
    let examSubjectId = '';
    if (exam.exams && Array.isArray(exam.exams) && exam.exams.length > 0) {
      const firstExam = exam.exams[0];
      examSubjectId = typeof firstExam.subjectId === 'object' ? firstExam.subjectId._id : firstExam.subjectId;
    } else if (exam.exam) {
      const subject = availableSubjects.find(sub => sub.name === exam.exam);
      if (subject) {
        examSubjectId = subject.id;
      }
    }

    // Extract date of birth components
    let birthDay = '', birthMonth = '', birthYear = '';
    if (exam.dateOfBirth) {
      const dob = new Date(exam.dateOfBirth);
      birthDay = dob.getDate().toString();
      birthMonth = (dob.getMonth() + 1).toString();
      birthYear = dob.getFullYear().toString();
    } else if (exam.birthDay && exam.birthMonth && exam.birthYear) {
      birthDay = exam.birthDay.toString();
      birthMonth = exam.birthMonth.toString();
      birthYear = exam.birthYear.toString();
    }

    // Format mobile numbers for display
    let mobileDisplay = '';
    if (exam.mobile) {
      let mobile = exam.mobile;
      if (mobile.startsWith('+94')) mobile = mobile.substring(3);
      else if (mobile.startsWith('0')) mobile = mobile.substring(1);
      mobileDisplay = mobile.replace(/\D/g, '');
    }

    let telephoneDisplay = '';
    if (exam.telephone) {
      let tel = exam.telephone;
      if (tel.startsWith('+94')) tel = tel.substring(3);
      else if (tel.startsWith('0')) tel = tel.substring(1);
      telephoneDisplay = tel.replace(/\D/g, '');
    }

    let guardianTelephoneDisplay = '';
    if (exam.guardianTelephone) {
      let tel = exam.guardianTelephone;
      if (tel.startsWith('+94')) tel = tel.substring(3);
      else if (tel.startsWith('0')) tel = tel.substring(1);
      guardianTelephoneDisplay = tel.replace(/\D/g, '');
    }

    let guardianMobileDisplay = '';
    if (exam.guardianMobile) {
      let mobile = exam.guardianMobile;
      if (mobile.startsWith('+94')) mobile = mobile.substring(3);
      else if (mobile.startsWith('0')) mobile = mobile.substring(1);
      guardianMobileDisplay = mobile.replace(/\D/g, '');
    }
    
    setFormData({
      exam: examSubjectId,
      examDate: examDateFormatted,
      title: exam.title || '',
      otherNames: exam.otherNames || exam.firstName || '',
      familyName: exam.familyName || exam.lastName || '',
      email: exam.email || '',
      birthDay: birthDay,
      birthMonth: birthMonth,
      birthYear: birthYear,
      gender: exam.gender || '',
      telephone: telephoneDisplay,
      mobile: mobileDisplay,
      specialNeeds: exam.specialNeeds || '',
      specialNeedsDetails: exam.specialNeedsDetails || '',
      guardianFirstName: exam.guardianFirstName || '',
      guardianLastName: exam.guardianLastName || '',
      guardianTelephone: guardianTelephoneDisplay,
      guardianMobile: guardianMobileDisplay,
      ukVisa: exam.ukVisa || '',
      candidateIdNumber: exam.candidateIdNumber || ''
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam record?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_CONFIG.API_URL}/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Exam record deleted successfully!');
        await fetchExams();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete exam record');
      }
    } catch (err) {
      console.error('Error deleting exam:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };


  const filteredExams = examRecords.filter((exam) => {
    const term = searchTerm.toLowerCase();
    const studentId = exam.studentIdNumber || (exam.studentId?.studentId || '');
    const studentName = exam.studentId?.name || '';
    return (
      studentId.toLowerCase().includes(term) ||
      studentName.toLowerCase().includes(term) ||
      (exam.ukVisa || '').toLowerCase().includes(term) ||
      (exam.exams && Array.isArray(exam.exams) && exam.exams.some(ex => {
        const subjectName = typeof ex.subjectId === 'object' ? ex.subjectId.name : ex.subjectName || '';
        return subjectName.toLowerCase().includes(term);
      })) ||
      (exam.exam || '').toLowerCase().includes(term) ||
      (exam.candidateIdNumber || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="exam-page">
      <Sidebar />
      <div className="exam-main-content">
        <Topbar userName={userName} />
        
        <div className="exam-content">
          <div className="exam-header">
            <h1>Exam Registration</h1>
            <div className="exam-header-actions">
              <div className="exam-search">
                <input
                  type="text"
                  placeholder="Search by student ID, name."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={!examRecords || examRecords.length === 0}
              >
                Generate Report
              </button>
              <button 
                className="add-exam-btn" 
                onClick={() => {
                  if (showForm) {
                    handleReset();
                  } else {
                    setShowForm(true);
                    setEditingExam(null);
                  }
                }}
              >
                {showForm ? 'Cancel' : '+ Add Exam'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="exam-form-container">
              <h2>{editingExam ? 'Edit Exam Record' : 'Add New Exam Record'}</h2>
              <form onSubmit={handleSubmit} className="exam-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <label htmlFor="studentIdInput">Student ID or Name <span className="required">*</span></label>
                  <div className="student-id-validation">
                    <div className="student-search-container" style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        id="studentIdInput"
                        value={studentIdInput}
                        onChange={handleStudentSearchChange}
                        onFocus={() => {
                          if (studentIdInput) {
                            const suggestions = getStudentSuggestions(studentIdInput);
                            setStudentSuggestions(suggestions);
                            setShowSuggestions(suggestions.length > 0);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="Type Student ID, first name, last name, or full name..."
                        disabled={!!validatedStudent}
                        required
                        autoComplete="off"
                        style={{ width: '100%' }}
                      />
                      {showSuggestions && studentSuggestions.length > 0 && (
                        <div className="student-suggestions-dropdown" style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          marginTop: '2px'
                        }}>
                          {studentSuggestions.map((student, index) => (
                            <div
                              key={student._id || index}
                              onClick={() => handleStudentSuggestionSelect(student)}
                              style={{
                                padding: '10px',
                                cursor: 'pointer',
                                borderBottom: index < studentSuggestions.length - 1 ? '1px solid #eee' : 'none'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                              <div style={{ fontSize: '0.9em', color: '#666' }}>ID: {student.studentId}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {!validatedStudent && (
                      <button
                        type="button"
                        className="validate-btn"
                        onClick={validateStudentId}
                        disabled={validatingStudent || !studentIdInput.trim()}
                      >
                        {validatingStudent ? 'Validating...' : 'Validate'}
                      </button>
                    )}
                    {validatedStudent && (
                      <button
                        type="button"
                        className="change-student-btn"
                        onClick={() => {
                          setValidatedStudent(null);
                          setStudentIdInput('');
                          setShowForm(false);
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                  {studentValidationError && (
                    <div className="error-message">{studentValidationError}</div>
                  )}
                </div>

                {validatedStudent && (
                  <>
                    <div className="form-group">
                      <label htmlFor="exam">Exam <span className="required">*</span></label>
                      <select
                        id="exam"
                        name="exam"
                        value={formData.exam}
                        onChange={handleExamSelect}
                        disabled={loadingSubjects}
                        required
                      >
                        <option value="" disabled>Select an exam</option>
                        {availableSubjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="examDate">Exam Date</label>
                      <input
                        type="date"
                        id="examDate"
                        name="examDate"
                        value={formData.examDate}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="title">Title <span className="required">*</span></label>
                      <select
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="" disabled>Select title</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="otherNames">Other Names <span className="required">*</span></label>
                        <input
                          type="text"
                          id="otherNames"
                          name="otherNames"
                          value={formData.otherNames}
                          onChange={handleInputChange}
                          placeholder="Enter other names"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="familyName">Family Name <span className="required">*</span></label>
                        <input
                          type="text"
                          id="familyName"
                          name="familyName"
                          value={formData.familyName}
                          onChange={handleInputChange}
                          placeholder="Enter family name"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email <span className="required">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="birthDay">Day <span className="required">*</span></label>
                        <input
                          type="number"
                          id="birthDay"
                          name="birthDay"
                          value={formData.birthDay}
                          onChange={handleInputChange}
                          placeholder="DD"
                          min="1"
                          max="31"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="birthMonth">Month <span className="required">*</span></label>
                        <input
                          type="number"
                          id="birthMonth"
                          name="birthMonth"
                          value={formData.birthMonth}
                          onChange={handleInputChange}
                          placeholder="MM"
                          min="1"
                          max="12"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="birthYear">Year <span className="required">*</span></label>
                        <input
                          type="number"
                          id="birthYear"
                          name="birthYear"
                          value={formData.birthYear}
                          onChange={handleInputChange}
                          placeholder="YYYY"
                          min="1900"
                          max={new Date().getFullYear()}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="gender">Gender <span className="required">*</span></label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="telephone">Telephone <span className="required">*</span></label>
                        <div className="mobile-input-wrapper">
                          <span className="mobile-prefix">+94</span>
                          <input
                            type="tel"
                            id="telephone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleTelephoneChange}
                            placeholder="771234567"
                            required
                            maxLength="9"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="mobile">Mobile <span className="required">*</span></label>
                        <div className="mobile-input-wrapper">
                          <span className="mobile-prefix">+94</span>
                          <input
                            type="tel"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleMobileChange}
                            placeholder="771234567"
                            required
                            maxLength="9"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="specialNeeds">Special Needs</label>
                      <input
                        type="text"
                        id="specialNeeds"
                        name="specialNeeds"
                        value={formData.specialNeeds}
                        onChange={handleInputChange}
                        placeholder="Enter special needs"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="specialNeedsDetails">Special Needs Details</label>
                      <textarea
                        id="specialNeedsDetails"
                        name="specialNeedsDetails"
                        value={formData.specialNeedsDetails}
                        onChange={handleInputChange}
                        placeholder="Enter special needs details"
                        rows="4"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="guardianFirstName">Guardian FirstName</label>
                        <input
                          type="text"
                          id="guardianFirstName"
                          name="guardianFirstName"
                          value={formData.guardianFirstName}
                          onChange={handleInputChange}
                          placeholder="Enter guardian first name"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="guardianLastName">Guardian LastName</label>
                        <input
                          type="text"
                          id="guardianLastName"
                          name="guardianLastName"
                          value={formData.guardianLastName}
                          onChange={handleInputChange}
                          placeholder="Enter guardian last name"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="guardianTelephone">Guardian Telephone</label>
                        <div className="mobile-input-wrapper">
                          <span className="mobile-prefix">+94</span>
                          <input
                            type="tel"
                            id="guardianTelephone"
                            name="guardianTelephone"
                            value={formData.guardianTelephone}
                            onChange={handleGuardianTelephoneChange}
                            placeholder="771234567"
                            maxLength="9"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="guardianMobile">Guardian Mobile</label>
                        <div className="mobile-input-wrapper">
                          <span className="mobile-prefix">+94</span>
                          <input
                            type="tel"
                            id="guardianMobile"
                            name="guardianMobile"
                            value={formData.guardianMobile}
                            onChange={handleGuardianMobileChange}
                            placeholder="771234567"
                            maxLength="9"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="ukVisa">For Uk Visa</label>
                        <input
                          type="text"
                          id="ukVisa"
                          name="ukVisa"
                          value={formData.ukVisa}
                          onChange={handleInputChange}
                          placeholder="Enter UK Visa (Optional)"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="candidateIdNumber">Candidate ID Number</label>
                        <input
                          type="text"
                          id="candidateIdNumber"
                          name="candidateIdNumber"
                          value={formData.candidateIdNumber}
                          onChange={handleInputChange}
                          placeholder="Enter Candidate ID Number (Optional)"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={handleReset}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading 
                          ? (editingExam ? 'Updating...' : 'Saving...') 
                          : (editingExam ? 'Update Exam' : 'Save Exam')
                        }
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          <div className="exam-records-section">
            <h2>Exam Records</h2>
            {examRecords.length === 0 ? (
              <div className="empty-state">
                <p>No exam records found. Click "Add New Exam" to create one.</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="empty-state">
                <p>No exam records match your search.</p>
              </div>
            ) : (
              <div className="exam-table-container">
                <table className="exam-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Exam</th>
                      <th>Exam Date</th>
                      <th>Title</th>
                      <th>Other Names</th>
                      <th>Family Name</th>
                      <th>Email</th>
                      <th>Day</th>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Gender</th>
                      <th>Telephone</th>
                      <th>Mobile</th>
                      <th>Special Needs</th>
                      <th>Special Needs Details</th>
                      <th>Guardian FirstName</th>
                      <th>Guardian LastName</th>
                      <th>Guardian Telephone</th>
                      <th>Guardian Mobile</th>
                      <th>For Uk Visa</th>
                      <th>Candidate ID Number</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => {
                      // derive day/month/year if provided as separate fields or from dateOfBirth
                      let day = exam.birthDay || '';
                      let month = exam.birthMonth || '';
                      let year = exam.birthYear || '';
                      if ((!day || !month || !year) && exam.dateOfBirth) {
                        const dob = new Date(exam.dateOfBirth);
                        day = day || dob.getDate().toString();
                        month = month || (dob.getMonth() + 1).toString();
                        year = year || dob.getFullYear().toString();
                      }
                      
                      return (
                        <tr key={exam._id}>
                          <td className="student-id-cell">{exam.studentIdNumber || exam.studentId?.studentId || '-'}</td>
                          <td className="exam-subject-cell">
                            <div className="subject-badges">
                              {exam.exams && Array.isArray(exam.exams) && exam.exams.length > 0
                                ? exam.exams.map((ex, idx) => {
                                    const subjectName =
                                      (ex.subjectId && typeof ex.subjectId === 'object' && ex.subjectId.name) ||
                                      ex.subjectName ||
                                      '-';
                                    return (
                                      <span key={idx} className="exam-badge">{subjectName}</span>
                                    );
                                  })
                                : <span className="exam-badge">{exam.exam || '-'}</span>
                              }
                            </div>
                          </td>
                          <td>{exam.examDate ? formatDate(exam.examDate) : '-'}</td>
                          <td>{exam.title || '-'}</td>
                          <td className="student-name-cell">{exam.otherNames || exam.firstName || '-'}</td>
                          <td className="student-name-cell">{exam.familyName || exam.lastName || '-'}</td>
                          <td>{exam.email || exam.studentId?.email || '-'}</td>
                          <td>{day || '-'}</td>
                          <td>{month || '-'}</td>
                          <td>{year || '-'}</td>
                          <td>{exam.gender || exam.studentId?.gender || '-'}</td>
                          <td>{exam.telephone || '-'}</td>
                          <td>{exam.mobile || exam.studentId?.mobile || '-'}</td>
                          <td>{exam.specialNeeds || exam.studentId?.specialNeed || '-'}</td>
                          <td className="details-cell">{exam.specialNeedsDetails || exam.studentId?.specialNeedsDetails || '-'}</td>
                          <td>{exam.guardianFirstName || exam.studentId?.guardianFirstName || '-'}</td>
                          <td>{exam.guardianLastName || exam.studentId?.guardianLastName || '-'}</td>
                          <td>{exam.guardianTelephone || exam.studentId?.guardianTelephone || '-'}</td>
                          <td>{exam.guardianMobile || '-'}</td>
                          <td>{exam.ukVisa || '-'}</td>
                          <td>{exam.candidateIdNumber || '-'}</td>
                          <td>
                            <div className="exam-actions">
                              <button
                                className="edit-btn"
                                onClick={() => handleEdit(exam)}
                                title="Edit Exam"
                              >
                                Edit
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDelete(exam._id)}
                                title="Delete Exam"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;

