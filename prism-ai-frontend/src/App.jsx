// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import IncidentAnalysis from './pages/IncidentAnalysis';
import AnalysisHistory from './pages/AnalysisHistory';
import AnalysisDetails from './pages/AnalysisDetails'; // ADD THIS IMPORT
// import Settings from './pages/SettingsPage';

import ErrorBoundary from './components/Common/ErrorBoundary';
import './App.css';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<IncidentAnalysis />} />
            <Route path="/history" element={<AnalysisHistory />} />
            <Route path="/analysis/:id" element={<AnalysisDetails />} /> {/* ADD THIS ROUTE */}
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;