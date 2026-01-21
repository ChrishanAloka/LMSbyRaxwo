import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import API_CONFIG from '../../config/api';
import './ExamRegistrationPage.css';

const ExamRegistrationPage = () => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [existingExamRecord, setExistingExamRecord] = useState(null);

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
      const response = await fetch(`${API_CONFIG.API_URL}/exams`);
      
      // Handle 401 - backend might need restart or route not updated
      // Silently handle this error - backend needs to be restarted
      if (response.status === 401) {
        setExamRecords([]);
        return;
      }
      
      if (!response.ok) {
        setExamRecords([]);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setExamRecords(data.data || []);
      } else {
        setExamRecords([]);
      }
    } catch (err) {
      // Silently handle errors - backend may not be restarted yet
      setExamRecords([]);
    }
  };

  // Fetch student suggestions for autocomplete
  const fetchStudentSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.API_URL}/students/search/autocomplete?query=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setStudentSuggestions(data.data);
        setShowSuggestions(data.data.length > 0);
      } else {
        setStudentSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Error fetching student suggestions:', err);
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleStudentSearchChange = (e) => {
    const searchTerm = e.target.value;
    setStudentIdInput(searchTerm);
    
    if (searchTerm.trim()) {
      fetchStudentSuggestions(searchTerm);
    } else {
      setStudentSuggestions([]);
      setShowSuggestions(false);
    }

    setValidatedStudent(null);
    setStudentValidationError('');
  };

  const handleStudentSuggestionSelect = async (student) => {
    setStudentIdInput(`${student.name} (ID: ${student.studentId})`);
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setValidatedStudent(student);
    setStudentValidationError('');
    
    // Refresh exam records and check if exam record already exists for this student
    try {
      const response = await fetch(`${API_CONFIG.API_URL}/exams`);
      
      // Handle 401 silently - backend may need restart
      if (response.status === 401) {
        setExamRecords([]);
        // Continue with form display if backend not ready
        setExistingExamRecord(null);
        setShowForm(true);
        
        // Pre-fill form with student data
        const nameParts = (student.name || '').trim().split(/\s+/);
        const firstName = nameParts.shift() || '';
        const lastName = nameParts.join(' ');
        
        setFormData({
          exam: '',
          examDate: '',
          title: '',
          otherNames: firstName,
          familyName: lastName,
          email: student.email || '',
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
        return;
      }
      
      if (!response.ok) {
        setExamRecords([]);
        setExistingExamRecord(null);
        setShowForm(true);
        
        // Pre-fill form with student data
        const nameParts = (student.name || '').trim().split(/\s+/);
        const firstName = nameParts.shift() || '';
        const lastName = nameParts.join(' ');
        
        setFormData({
          exam: '',
          examDate: '',
          title: '',
          otherNames: firstName,
          familyName: lastName,
          email: student.email || '',
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
        return;
      }
      
      const data = await response.json();
      const updatedExamRecords = data.success ? (data.data || []) : [];
      setExamRecords(updatedExamRecords);
      
      // Check if exam record already exists for this student
      // Match by studentId (object with _id or string) or studentIdNumber
      let existingExam = null;
      
      for (const exam of updatedExamRecords) {
        // Check if studentId matches (could be object with _id or string)
        const examStudentId = exam.studentId;
        let studentIdMatch = false;
        
        if (examStudentId) {
          if (typeof examStudentId === 'object' && examStudentId._id) {
            // Populated student object - compare _id
            studentIdMatch = examStudentId._id.toString() === student._id.toString();
          } else if (typeof examStudentId === 'string') {
            // String ID
            studentIdMatch = examStudentId.toString() === student._id.toString();
          }
        }
        
        // Check if studentIdNumber matches
        const studentIdNumberMatch = exam.studentIdNumber && 
          exam.studentIdNumber.toString().trim() === student.studentId.toString().trim();
        
        if (studentIdMatch || studentIdNumberMatch) {
          existingExam = exam;
          break;
        }
      }
      
      if (existingExam) {
        // Show existing exam record - DO NOT show form
        setExistingExamRecord(existingExam);
        setShowForm(false);
        // Clear form data to ensure form doesn't show
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
      } else {
        // No existing record, show form
        setExistingExamRecord(null);
        setShowForm(true);
        
        // Pre-fill form with student data
        const nameParts = (student.name || '').trim().split(/\s+/);
        const firstName = nameParts.shift() || '';
        const lastName = nameParts.join(' ');
        
        setFormData({
          exam: '',
          examDate: '',
          title: '',
          otherNames: firstName,
          familyName: lastName,
          email: student.email || '',
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
      }
    } catch (err) {
      console.error('Error checking existing exam records:', err);
      // If error occurs, just show the form
      setExistingExamRecord(null);
      setShowForm(true);
      
      // Pre-fill form with student data
      const nameParts = (student.name || '').trim().split(/\s+/);
      const firstName = nameParts.shift() || '';
      const lastName = nameParts.join(' ');
      
      setFormData({
        exam: '',
        examDate: '',
        title: '',
        otherNames: firstName,
        familyName: lastName,
        email: student.email || '',
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
    }
  };

  const validateStudentId = async () => {
    if (!studentIdInput.trim()) {
      setStudentValidationError('Please enter a Student ID or Name');
      return;
    }

    if (validatedStudent) {
      return;
    }

    setValidatingStudent(true);
    setStudentValidationError('');
    setValidatedStudent(null);

    try {
      // Use the autocomplete endpoint to find student
      const response = await fetch(
        `${API_CONFIG.API_URL}/students/search/autocomplete?query=${encodeURIComponent(studentIdInput.trim())}`
      );
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Find exact match by ID or name
        const searchTerm = studentIdInput.trim().toLowerCase();
        let student = data.data.find(s => 
          s.studentId.toLowerCase() === searchTerm || 
          s.name.toLowerCase() === searchTerm
        );
        
        // If no exact match, use first result
        if (!student && data.data.length > 0) {
          student = data.data[0];
        }
        
        if (student) {
          setValidatedStudent(student);
          setStudentValidationError('');
          
          // Fetch latest exam records to check for existing record
          const examResponse = await fetch(`${API_CONFIG.API_URL}/exams`);
          
          // Handle 401 silently - backend may need restart
          if (examResponse.status === 401) {
            setExamRecords([]);
            // Continue with form display if backend not ready
            setExistingExamRecord(null);
            setShowForm(true);
            
            // Pre-fill form with student data
            const nameParts = (student.name || '').trim().split(/\s+/);
            const firstName = nameParts.shift() || '';
            const lastName = nameParts.join(' ');
            
            setFormData({
              exam: '',
              examDate: '',
              title: '',
              otherNames: firstName,
              familyName: lastName,
              email: student.email || '',
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
            return;
          }
          
          if (!examResponse.ok) {
            setExamRecords([]);
            setExistingExamRecord(null);
            setShowForm(true);
            
            // Pre-fill form with student data
            const nameParts = (student.name || '').trim().split(/\s+/);
            const firstName = nameParts.shift() || '';
            const lastName = nameParts.join(' ');
            
            setFormData({
              exam: '',
              examDate: '',
              title: '',
              otherNames: firstName,
              familyName: lastName,
              email: student.email || '',
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
            return;
          }
          
          const examData = await examResponse.json();
          const updatedExamRecords = examData.success ? (examData.data || []) : [];
          
          // Update examRecords state with latest data
          setExamRecords(updatedExamRecords);
          
          // Check if exam record already exists for this student
          // Match by studentId (object with _id or string) or studentIdNumber
          let existingExam = null;
          
          for (const exam of updatedExamRecords) {
            // Check if studentId matches (could be object with _id or string)
            const examStudentId = exam.studentId;
            let studentIdMatch = false;
            
            if (examStudentId) {
              if (typeof examStudentId === 'object' && examStudentId._id) {
                // Populated student object - compare _id
                studentIdMatch = examStudentId._id.toString() === student._id.toString();
              } else if (typeof examStudentId === 'string') {
                // String ID
                studentIdMatch = examStudentId.toString() === student._id.toString();
              }
            }
            
            // Check if studentIdNumber matches
            const studentIdNumberMatch = exam.studentIdNumber && 
              exam.studentIdNumber.toString().trim() === student.studentId.toString().trim();
            
            if (studentIdMatch || studentIdNumberMatch) {
              existingExam = exam;
              break;
            }
          }
          
          if (existingExam) {
            // Show existing exam record - DO NOT show form
            setExistingExamRecord(existingExam);
            setShowForm(false);
            // Clear form data to ensure form doesn't show
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
          } else {
            // No existing record, show form
            setExistingExamRecord(null);
            setShowForm(true);
            
            // Pre-fill form with student data
            const nameParts = (student.name || '').trim().split(/\s+/);
            const firstName = nameParts.shift() || '';
            const lastName = nameParts.join(' ');
            
            setFormData({
              exam: '',
              examDate: '',
              title: '',
              otherNames: firstName,
              familyName: lastName,
              email: student.email || '',
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
          }
        } else {
          setStudentValidationError('Student not found. Please check your Student ID or Name.');
          setValidatedStudent(null);
        }
      } else {
        setStudentValidationError('Student not found. Please check your Student ID or Name.');
        setValidatedStudent(null);
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
      const response = await fetch(`${API_CONFIG.API_URL}/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        setSuccess('Exam registration submitted successfully!');
        // Refresh exam records to show the newly created record
        await fetchExams();
        // Check if the created exam should be displayed
        const updatedResponse = await fetch(`${API_CONFIG.API_URL}/exams`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          if (updatedData.success && updatedData.data) {
            const newExam = updatedData.data.find(exam => 
              (exam.studentId && (
                (typeof exam.studentId === 'object' && exam.studentId._id && exam.studentId._id.toString() === validatedStudent._id.toString()) ||
                (typeof exam.studentId === 'string' && exam.studentId === validatedStudent._id.toString())
              )) ||
              (exam.studentIdNumber && exam.studentIdNumber.toString().trim() === validatedStudent.studentId.toString().trim())
            );
            if (newExam) {
              setExistingExamRecord(newExam);
              setShowForm(false);
            }
          }
        }
        handleReset();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        // Check if error is due to existing record
        if (data.exists && data.data) {
          setExistingExamRecord(data.data);
          setShowForm(false);
          setError('Exam record already exists for this student. Displaying existing record.');
          setTimeout(() => setError(''), 5000);
        } else {
          setError(data.message || 'Failed to submit exam registration');
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
    setExistingExamRecord(null);
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
    setError('');
    setStudentValidationError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredExams = examRecords.filter((exam) => {
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

  const handleSearch = (query) => {
    // This is for the Header component search (courses), not exam search
  };

  return (
    <div className="exam-registration-page">
      <Header onSearch={handleSearch} />
      
      <main className="exam-registration-main">
        <div className="exam-registration-content">
          <div className="exam-registration-header">
            <h1>Exam Registration</h1>
            <div className="exam-registration-header-actions">
              <div className="exam-search">
                <input
                  type="text"
                  placeholder="Search by student ID, name. "
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
                className="add-exam-btn" 
                onClick={() => {
                  if (showForm || existingExamRecord) {
                    handleReset();
                  } else {
                    setShowForm(true);
                  }
                }}
              >
                {(showForm || existingExamRecord) ? 'Cancel' : '+ Register for Exam'}
              </button>
            </div>
          </div>

          {existingExamRecord && (
            <div className="exam-form-container">
              <h2>Existing Exam Registration Found</h2>
              <div className="existing-exam-record">
                <div className="success-message" style={{ marginBottom: '1rem' }}>
                  This student already has an exam registration record.
                </div>
                <div className="exam-record-details">
                  <div className="detail-row">
                    <span className="detail-label">Student ID:</span>
                    <span className="detail-value">{existingExamRecord.studentIdNumber || existingExamRecord.studentId?.studentId || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Student Name:</span>
                    <span className="detail-value">{existingExamRecord.studentId?.name || existingExamRecord.otherNames + ' ' + existingExamRecord.familyName || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Exam:</span>
                    <span className="detail-value">
                      {existingExamRecord.exams && Array.isArray(existingExamRecord.exams) && existingExamRecord.exams.length > 0
                        ? existingExamRecord.exams.map((ex, idx) => {
                            const subjectName = (ex.subjectId && typeof ex.subjectId === 'object' && ex.subjectId.name) || ex.subjectName || '-';
                            return <span key={idx} className="exam-badge" style={{ marginRight: '0.5rem' }}>{subjectName}</span>;
                          })
                        : existingExamRecord.exam || '-'
                      }
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Exam Date:</span>
                    <span className="detail-value">{existingExamRecord.examDate ? formatDate(existingExamRecord.examDate) : '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Title:</span>
                    <span className="detail-value">{existingExamRecord.title || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Other Names:</span>
                    <span className="detail-value">{existingExamRecord.otherNames || existingExamRecord.firstName || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Family Name:</span>
                    <span className="detail-value">{existingExamRecord.familyName || existingExamRecord.lastName || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{existingExamRecord.email || existingExamRecord.studentId?.email || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Birth:</span>
                    <span className="detail-value">
                      {(() => {
                        let day = existingExamRecord.birthDay || '';
                        let month = existingExamRecord.birthMonth || '';
                        let year = existingExamRecord.birthYear || '';
                        if ((!day || !month || !year) && existingExamRecord.dateOfBirth) {
                          const dob = new Date(existingExamRecord.dateOfBirth);
                          day = day || dob.getDate().toString();
                          month = month || (dob.getMonth() + 1).toString();
                          year = year || dob.getFullYear().toString();
                        }
                        return day && month && year ? `${day}/${month}/${year}` : '-';
                      })()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{existingExamRecord.gender || existingExamRecord.studentId?.gender || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mobile:</span>
                    <span className="detail-value">{existingExamRecord.mobile || existingExamRecord.studentId?.mobile || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Telephone:</span>
                    <span className="detail-value">{existingExamRecord.telephone || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Candidate ID Number:</span>
                    <span className="detail-value">{existingExamRecord.candidateIdNumber || '-'}</span>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={handleReset}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showForm && !existingExamRecord && (
            <div className="exam-form-container">
              <h2>Register for Exam</h2>
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
                            fetchStudentSuggestions(studentIdInput);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="Type Student ID or Name..."
                        disabled={!!validatedStudent}
                        required
                        autoComplete="off"
                        style={{ width: '100%' }}
                      />
                      {showSuggestions && studentSuggestions.length > 0 && (
                        <div className="student-suggestions-dropdown">
                          {studentSuggestions.map((student, index) => (
                            <div
                              key={student._id || index}
                              onClick={() => handleStudentSuggestionSelect(student)}
                              className="suggestion-item"
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
                        <label htmlFor="telephone">Telephone</label>
                        <div className="mobile-input-wrapper">
                          <span className="mobile-prefix">+94</span>
                          <input
                            type="tel"
                            id="telephone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleTelephoneChange}
                            placeholder="771234567"
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
                        {loading ? 'Submitting...' : 'Submit Registration'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          <div className="exam-records-section">
            <h2>Registration Details</h2>
            {examRecords.length === 0 ? (
              <div className="empty-state">
                <p>No exam records found. Register for an exam to get started.</p>
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
                      <th>Name</th>
                      <th>Exam</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => {
                      // Get student name - combine otherNames/firstName and familyName/lastName
                      const firstName = exam.otherNames || exam.firstName || exam.studentId?.name?.split(' ')[0] || '';
                      const lastName = exam.familyName || exam.lastName || exam.studentId?.name?.split(' ').slice(1).join(' ') || '';
                      const fullName = exam.studentId?.name || `${firstName} ${lastName}`.trim() || '-';
                      
                      return (
                        <tr key={exam._id}>
                          <td className="student-id-cell">{exam.studentIdNumber || exam.studentId?.studentId || '-'}</td>
                          <td className="student-name-cell">{fullName}</td>
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
                          <td>
                            <span className="status-badge registered">Registered</span>
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
      </main>
    </div>
  );
};

export default ExamRegistrationPage;

