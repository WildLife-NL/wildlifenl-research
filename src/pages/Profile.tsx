import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyProfile } from '../services/profileService';
import { User } from '../types/user';
import '../styles/Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await getMyProfile();
        setUser(profile);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load profile.');
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Remove the token from local storage
    navigate('/login'); // Redirect to the login page
  };

  return (
    <div className="profile-page">
      {/* Navbar */}
      <Navbar />

      {/* Profile Content */}
      <div className="profile-content">
        {user && (
          <div className="profile-info">
            <h2>Profile</h2>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.roles[0]?.name || 'N/A'}</p>

            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;