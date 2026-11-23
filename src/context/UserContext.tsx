// Signed-in researcher shared by the app shell, so pages stop reading the user from router state
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getMyProfile } from '../services/profileService';
import { User } from '../types/user';

const UserContext = createContext<User | undefined>(undefined);

interface UserProviderProps {
  user: User;
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ user, children }) => (
  <UserContext.Provider value={user}>{children}</UserContext.Provider>
);

// Without a provider (a page rendered on its own, as in unit tests) the profile is fetched here instead
export const useCurrentUser = (): User | null => {
  const provided = useContext(UserContext);
  const [fetched, setFetched] = useState<User | null>(null);

  useEffect(() => {
    if (provided !== undefined) return;
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (!cancelled) setFetched(profile);
      })
      .catch((error) => console.error('Error fetching profile:', error));
    return () => {
      cancelled = true;
    };
  }, [provided]);

  return provided ?? fetched;
};
