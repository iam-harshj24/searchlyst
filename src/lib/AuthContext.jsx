import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'searchlyst',
    public_settings: {}
  });

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      const response = await apiClient.auth.verify();
      if (response?.success && response?.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: error.message || 'Session expired'
      });
    } finally {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const signInAnonymously = async () => {
    try {
      const response = await apiClient.auth.anonymous();
      if (response.success) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      console.error('Anon login failed:', error);
    }
    return { success: false };
  };

  const login = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiClient.auth.login(email, password);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed'
      });
      return { success: false, error };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (email, password, name) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiClient.auth.register(email, password, name);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      setAuthError({
        type: 'register_failed',
        message: error.message || 'Registration failed'
      });
      return { success: false, error };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    apiClient.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    navigate('/Login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      signInAnonymously,
      login,
      register,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
