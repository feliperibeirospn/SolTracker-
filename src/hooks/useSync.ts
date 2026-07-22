import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export const useSync = () => {
  const { userEmail, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && isAuthenticated && userEmail) {
      // Logic for automatic sync detection can be added here
      console.log('Online detected. Sync available.');
    }
  }, [isOnline, isAuthenticated, userEmail]);

  return { isOnline };
};
