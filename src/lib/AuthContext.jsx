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

  const loginWithGoogle = async (idToken) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await apiClient.auth.google(idToken);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      setAuthError({
        type: 'google_login_failed',
        message: error.message || 'Google login failed',
      });
      return { success: false, error };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const sendOtp = async (email, password, name) => {
    setAuthError(null);
    try {
      const response = await apiClient.auth.sendOtp(email, password, name);
      return { success: true, otpSent: response.otpSent };
    } catch (error) {
      setAuthError({
        type: 'register_failed',
        message: error.message || 'Registration failed'
      });
      return { success: false, error };
    }
  };

  const verifyOtp = async (email, otp) => {
    setAuthError(null);
    try {
      const response = await apiClient.auth.verifyOtp(email, otp);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      // Preserve the original error message from the server
      const message = error.message || 'Verification failed';
      setAuthError({ type: 'otp_failed', message });
      return { success: false, error, message };
    }
  };

  const forgotPassword = async (email) => {
    setAuthError(null);
    try {
      const response = await apiClient.auth.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      setAuthError({
        type: 'forgot_password_failed',
        message: error.message || 'Failed to request password reset'
      });
      return { success: false, error };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    setAuthError(null);
    try {
      const response = await apiClient.auth.resetPassword(email, otp, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      setAuthError({
        type: 'reset_password_failed',
        message: error.message || 'Failed to reset password'
      });
      return { success: false, error };
    }
  };

  const logout = () => {
    apiClient.auth.logout();
    // Clear visibility/scan cache only; keep searchlyst_user_* so returning users retain profile/onboarding state
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('searchlyst_visibility_') || key?.startsWith('searchlyst_active_scan_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
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
      loginWithGoogle,
      sendOtp,
      verifyOtp,
      forgotPassword,
      resetPassword,
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
