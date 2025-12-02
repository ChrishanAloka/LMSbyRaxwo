import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CoursesPage from './pages/client/CoursesPage';
import ClassesPage from './pages/client/ClassesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import LoginPage from './pages/admin/LoginPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import EmployeePage from './pages/admin/EmployeePage';
import StudentsPage from './pages/admin/StudentsPage';
import SalaryPage from './pages/admin/SalaryPage';
import ClassPage from './pages/admin/ClassPage';
import ClassesViewPage from './pages/admin/ClassesViewPage';
import ExpensesPage from './pages/admin/ExpensesPage';
import IncomePage from './pages/admin/IncomePage';
import ExtraIncomePage from './pages/admin/ExtraIncomePage';
import MarksPage from './pages/admin/MarksPage';
import PaymentPage from './pages/admin/PaymentPage';
import ExamPage from './pages/admin/ExamPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          
          {/* Admin Authentication */}
          <Route path="/admin/login" element={<LoginPage />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin/Dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/subjects" 
            element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/class" 
            element={
              <ProtectedRoute>
                <ClassPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/classes/view" 
            element={
              <ProtectedRoute>
                <ClassesViewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/employee" 
            element={
              <ProtectedRoute>
                <EmployeePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/students" 
            element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/salary" 
            element={
              <ProtectedRoute>
                <SalaryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/expenses" 
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/income" 
            element={
              <ProtectedRoute>
                <IncomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/extra-income" 
            element={
              <ProtectedRoute>
                <ExtraIncomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payment" 
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/marks" 
            element={
              <ProtectedRoute>
                <MarksPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/exam" 
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin" element={<Navigate to="/admin/Dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/admin/Dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
