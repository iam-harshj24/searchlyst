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
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);
    
    // Auth Bypass: Always simulate a successful session using a real signed JWT
    // This token is signed with the backend's JWT_SECRET and represents harsh@gmail.com (id=11)
    const DEV_BYPASS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImVtYWlsIjoiaGFyc2hAZ21haWwuY29tIiwicm9sZSI6ImZvdW5kZXIiLCJuYW1lIjoiSGFyc2giLCJpYXQiOjE3NzQ4NjkzMDAsImV4cCI6MTgwNjQwNTMwMH0.v9T98EPbM7S7boEkcSk-KX1F__vCQ_gm5qdnH_sbu7g';

    const mockUser = {
      id: 11,
      name: 'Harsh',
      email: 'harsh@gmail.com',
      role: 'founder',
      brandName: 'Searchlyst'
    };
    
    localStorage.setItem('authToken', DEV_BYPASS_TOKEN);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    setUser(mockUser);
    setIsAuthenticated(true);
    
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
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
