import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({ isLoggedIn: false });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  function reloadPlatformData() {
    return api.platformData()
      .then((payload) => {
        setData(payload);
        setProfile(payload.profile || { isLoggedIn: false });
        return payload;
      })
      .catch((requestError) => {
        setError(requestError.message);
        throw requestError;
      });
  }

  useEffect(() => {
    reloadPlatformData();
  }, []);

  const value = useMemo(() => ({
    data,
    setData,
    profile,
    setProfile,
    notice,
    setNotice,
    error,
    setError,
    reloadPlatformData,
  }), [data, profile, notice, error]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}
