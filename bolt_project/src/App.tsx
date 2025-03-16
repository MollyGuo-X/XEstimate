import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { NewProject } from './components/NewProject';
import { ProjectDetails } from './components/ProjectDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;