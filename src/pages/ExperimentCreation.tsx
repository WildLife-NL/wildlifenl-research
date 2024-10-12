import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ExperimentCreation: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove the token from local storage
    navigate('/login'); // Redirect to the login page
  };

  return (
    <div>
      {/* Navbar */}
      <Navbar />
      <h1>Export</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default ExperimentCreation;