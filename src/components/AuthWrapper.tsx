import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, hasResearcherRole } from '../services/authService';
import { getMyProfile } from '../services/profileService';
import { isRateLimited } from '../services/problemDetails';
import { UserProvider } from '../context/UserContext';
import { LoadingState } from './ui/Layout';
import { User } from '../types/user';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Guards every signed-in route, loads the profile once and shares it with the pages
const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [attempt, setAttempt] = useState<number>(0);

  // The token is checked on every route change, so signing out elsewhere sends the user back to sign in
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;

    getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        if (hasResearcherRole(profile)) {
          setUser(profile);
        } else {
          navigate('/unauthorized', { replace: true });
        }
      })
      .catch((error) => {
        console.error('Error fetching user role:', error);
        if (cancelled) return;
        // The API asked to slow down, which says nothing about the account, so check again after the wait
        if (isRateLimited(error)) {
          setRetryAfter(error.retryAfter);
        } else {
          navigate('/unauthorized', { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, attempt]);

  // Waits as long as the API asked, then checks the access again
  useEffect(() => {
    if (retryAfter === null) return;
    const timer = setTimeout(() => {
      setRetryAfter(null);
      setAttempt((current) => current + 1);
    }, retryAfter * 1000);
    return () => clearTimeout(timer);
  }, [retryAfter]);

  if (!user) {
    const label =
      retryAfter === null
        ? 'Checking your access…'
        : `The WildlifeNL API asked ResearchConnect to slow down. Checking your access again in ${retryAfter} seconds…`;
    return <LoadingState label={label} page />;
  }

  return <UserProvider user={user}>{children}</UserProvider>;
};

export default AuthWrapper;
