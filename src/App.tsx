import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing'; // <--- On importe la nouvelle page

function App() {
  return (
    <Router>
      <Routes>
        {/* La page d'accueil (Landing) est maintenant la racine "/" */}
        <Route path="/" element={<Landing />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Si on tape n'importe quoi, on renvoie vers l'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;