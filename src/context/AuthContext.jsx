import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Check if a JWT token is expired
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // treat invalid tokens as expired
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('loomiq_token');
      // If token is expired, clear storage and return null
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('loomiq_user');
        localStorage.removeItem('loomiq_token');
        return null;
      }
      return JSON.parse(localStorage.getItem('loomiq_user'));
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('loomiq_token');
    if (!stored || isTokenExpired(stored)) {
      localStorage.removeItem('loomiq_token');
      localStorage.removeItem('loomiq_user');
      return null;
    }
    return stored;
  });

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('loomiq_user', JSON.stringify(userData));
    localStorage.setItem('loomiq_token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('loomiq_user');
    localStorage.removeItem('loomiq_token');
  };

  const authFetch = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch, isLoggedIn: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
}