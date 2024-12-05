import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../services/authService';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (isAuthenticated()) {
        const role = await getUserRole();
        if (role === 3) {
          // User has the Researcher role
          setLoading(false); // Allow rendering of protected components
        } else {
          // User does not have the Researcher role
          navigate('/unauthorized', { replace: true });
        }
      } else {
        // User is not authenticated
        navigate('/login', { replace: true });
      }
    };

    checkAuthStatus();
  }, [navigate, location]);

  if (loading) {
    // You can show a loading indicator while checking authentication
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default AuthWrapper;