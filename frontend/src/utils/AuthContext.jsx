import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from './axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);

  // 🔁 Rehydrate auth on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      console.log('AuthContext init - token exists:', !!token, 'userData exists:', !!userData);

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Rehydrating user from localStorage:', parsedUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(parsedUser);
        } catch (err) {
          console.error('Failed to parse user data:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }

      try {
        await fetchCities();
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoading(false);
        console.log('AuthContext init complete - loading set to false');
      }
    };

    initAuth();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await axios.get('/api/admin/cities/public');
      setCities(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const login = async (email, password, username) => {
    console.log('AuthContext login called with:', { email, username });
    
    const response = await axios.post('/api/auth/login', {
      email,
      password,
      username
    });

    console.log('Login response:', response.data);

    const { token, user } = response.data;

    // ✅ Persist auth - SYNCHRONOUS localStorage writes
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Verify localStorage write
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    console.log('Verified localStorage - token saved:', !!savedToken, 'user saved:', !!savedUser);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('Setting user in context:', user);
    setUser(user);
    
    // Force a small delay to ensure state is committed
    await new Promise(resolve => setTimeout(resolve, 50));

    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post('/api/auth/register', userData);
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(user);
    return response.data;
  };

  const updateUserCity = (cityId, cityName) => {
    const updatedUser = { ...user, cityId, cityName };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return Array.isArray(roles)
      ? roles.includes(user.role)
      : user.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        cities,
        updateUserCity,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
