import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({
    id: 'searchlyst',
    public_settings: {},
  });

  useEffect(() => {
    checkAppState();
  }, []);

  /**
   * Restore session on app load.
   * 1. If no token in localStorage → not authenticated.
   * 2. Optimistically set user from localStorage for instant UI.
   * 3. Validate the token with the backend; clear session if invalid/expired.
   */
  const checkAppState = async () => {
    setIsLoadingAuth(true);
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      return;
    }

    // Instantly restore from cache so the UI doesn't flash blank
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch { /* ignore */ }
    }

    try {
      const response = await apiClient.auth.verify();
      if (response?.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        setIsAuthenticated(true);
      } else {
        _clearSession();
      }
    } catch {
      // 401 or network error — clear stale session
      _clearSession();
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const _clearSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // ── Sign in anonymously (guest mode) ─────────────────────────────────────
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
      console.error('Anonymous login failed:', error);
    }
    return { success: false };
  };

  // ── Email / password login ────────────────────────────────────────────────
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
      setAuthError({ type: 'login_failed', message: error.message || 'Login failed' });
      return { success: false, error };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // ── Google OAuth login ────────────────────────────────────────────────────
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
      setAuthError({ type: 'google_login_failed', message: error.message || 'Google login failed' });
      return { success: false, error };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // ── Signup step 1: send OTP ───────────────────────────────────────────────
  const sendOtp = async (email, password, name) => {
    setAuthError(null);
    try {
      const response = await apiClient.auth.sendOtp(email, password, name);
      return { success: true, otpSent: response.otpSent };
    } catch (error) {
      setAuthError({ type: 'register_failed', message: error.message || 'Registration failed' });
      return { success: false, error };
    }
  };

  // ── Signup step 2: verify OTP → create account ───────────────────────────
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
      const message = error.message || 'Verification failed';
      setAuthError({ type: 'otp_failed', message });
      return { success: false, error, message };
    }
  };

  // ── Forgot password: send reset OTP ──────────────────────────────────────
  const forgotPassword = async (email) => {
    setAuthError(null);
    try {
      const response = await apiClient.auth.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (error) {
      setAuthError({ type: 'forgot_password_failed', message: error.message || 'Failed to request password reset' });
      return { success: false, error };
    }
  };

  // ── Reset password: verify OTP + set new password ────────────────────────
  const resetPassword = async (email, otp, newPassword) => {
    setAuthError(null);
    try {
      const response = await apiClient.auth.resetPassword(email, otp, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      setAuthError({ type: 'reset_password_failed', message: error.message || 'Failed to reset password' });
      return { success: false, error };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    apiClient.auth.logout();
    // Clear scan cache; keep onboarding/profile keys so returning users don't re-onboard
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.startsWith('searchlyst_visibility_') ||
        key?.startsWith('searchlyst_active_scan_')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setUser(null);
    setIsAuthenticated(false);
    navigate('/Login');
  };

  const navigateToLogin = () => navigate('/Login');

  return (
    <AuthContext.Provider
      value={{
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
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
