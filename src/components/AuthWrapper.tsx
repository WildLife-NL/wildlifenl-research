import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = () => {
      if (isAuthenticated()) {
        if (window.location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } else {
        if (window.location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    };

    checkAuthStatus();

    // Set an interval to keep checking if the user is authenticated
    const intervalId = setInterval(checkAuthStatus, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId); 
  }, [navigate]);

  return <>{children}</>;
};

export default AuthWrapper;
