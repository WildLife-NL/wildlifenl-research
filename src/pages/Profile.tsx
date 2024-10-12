import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Profile: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove the token from local storage
    navigate('/login'); // Redirect to the login page
  };

  return (
    <div>
      {/* Navbar */}
      <Navbar />
      <h1>Profile Page</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Profile;