import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState } from '@/types/loan';

// Enhanced admin credentials with role-based access
const ADMIN_CREDENTIALS = {
  email: 'admin@srivinayatender.com',
  password: 'SriVinaya@2025', // More secure password
  role: 'SUPER_ADMIN',
  lastPasswordChange: new Date().toISOString(),
};

// Security configuration
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  sessionTimeoutMinutes: 30,
  passwordExpiryDays: 90,
  requirePasswordChange: false,
};

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCredentials: (
    currentEmail: string,
    currentPassword: string,
    newEmail: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  updateActivity: () => void;
  getSecurityLogs: () => any[];
  isPasswordExpired: () => boolean;
  isLocked: boolean;
  lockoutEndTime: Date | null;
  loginAttempts: number;
  remainingAttempts: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    adminEmail: null,
    sessionToken: null,
  });

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check for existing session and lockout status on mount
    const token = localStorage.getItem('session_token');
    const email = localStorage.getItem('admin_email');
    const loginTime = localStorage.getItem('login_time');
    const attempts = localStorage.getItem('login_attempts');
    const lockoutEnd = localStorage.getItem('lockout_end');

    // Check if account is locked
    if (lockoutEnd) {
      const lockoutEndDate = new Date(lockoutEnd);
      if (new Date() < lockoutEndDate) {
        setIsLocked(true);
        setLockoutEndTime(lockoutEndDate);
        return;
      } else {
        // Lockout expired, clear it
        localStorage.removeItem('lockout_end');
        localStorage.removeItem('login_attempts');
      }
    }

    // Set current login attempts
    if (attempts) setLoginAttempts(parseInt(attempts));

    if (token && email && loginTime) {
      const now = Date.now();
      const sessionAge = now - parseInt(loginTime);
      const sessionTimeout = SECURITY_CONFIG.sessionTimeoutMinutes * 60 * 1000;

      if (sessionAge < sessionTimeout) {
        setAuthState({ isAuthenticated: true, adminEmail: email, sessionToken: token });
        // Update login time for session extension
        localStorage.setItem('login_time', now.toString());
        // Start session timeout checker
        startSessionTimeoutChecker();
      } else {
        // Session expired
        logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateSessionToken = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2);
    const userAgent = btoa(navigator.userAgent.substring(0, 20));
    return `${timestamp}-${randomStr}-${userAgent}`;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Check if account is locked
    if (isLocked && lockoutEndTime && new Date() < lockoutEndTime) {
      const remainingTime = Math.ceil((lockoutEndTime.getTime() - new Date().getTime()) / (1000 * 60));
      return { success: false, message: `Account locked. Try again in ${remainingTime} minutes.` };
    }

    try {
      // Trim whitespace and normalize
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedExpectedEmail = ADMIN_CREDENTIALS.email.trim().toLowerCase();

      if (normalizedEmail === normalizedExpectedEmail && password === ADMIN_CREDENTIALS.password) {
        // Successful login - reset attempts and unlock
        setLoginAttempts(0);
        setIsLocked(false);
        setLockoutEndTime(null);
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('lockout_end');

        const token = generateSessionToken();
        const loginTime = Date.now().toString();

        localStorage.setItem('session_token', token);
        localStorage.setItem('admin_email', email);
        localStorage.setItem('login_time', loginTime);
        localStorage.setItem('last_activity', loginTime);

        setAuthState({ isAuthenticated: true, adminEmail: email, sessionToken: token });

        // Start session timeout checker
        startSessionTimeoutChecker();

        // Log successful login
        logSecurityEvent('LOGIN_SUCCESS', email);

        return { success: true };
      }

      // Failed login - increment attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      // Check if should lock account
      if (newAttempts >= SECURITY_CONFIG.maxLoginAttempts) {
        const lockoutEnd = new Date(Date.now() + SECURITY_CONFIG.lockoutDurationMinutes * 60 * 1000);
        setIsLocked(true);
        setLockoutEndTime(lockoutEnd);
        localStorage.setItem('lockout_end', lockoutEnd.toISOString());

        logSecurityEvent('ACCOUNT_LOCKED', email);

        return {
          success: false,
          message: `Too many failed attempts. Account locked for ${SECURITY_CONFIG.lockoutDurationMinutes} minutes.`,
        };
      }

      logSecurityEvent('LOGIN_FAILED', email);

      return {
        success: false,
        message: `Invalid credentials. ${SECURITY_CONFIG.maxLoginAttempts - newAttempts} attempts remaining.`,
      };
    } catch (error) {
      console.error('Login error:', error);
      logSecurityEvent('LOGIN_ERROR', email);
      return { success: false, message: 'Login system error. Please try again.' };
    }
  };

  const logout = () => {
    const email = authState.adminEmail;

    // Clear all session data
    localStorage.removeItem('session_token');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('login_time');
    localStorage.removeItem('last_activity');

    setAuthState({ isAuthenticated: false, adminEmail: null, sessionToken: null });

    // Log logout event
    if (email) logSecurityEvent('LOGOUT', email);

    // Clear session timeout
    if (window.sessionTimeoutInterval) {
      clearInterval(window.sessionTimeoutInterval);
    }
  };

  const updateCredentials = async (
    currentEmail: string,
    currentPassword: string,
    newEmail: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Verify current credentials first
      const normalizedCurrentEmail = currentEmail.trim().toLowerCase();
      const normalizedExpectedEmail = ADMIN_CREDENTIALS.email.trim().toLowerCase();

      if (normalizedCurrentEmail !== normalizedExpectedEmail || currentPassword !== ADMIN_CREDENTIALS.password) {
        logSecurityEvent('CREDENTIAL_CHANGE_FAILED', currentEmail);
        return { success: false, message: 'Current credentials are incorrect.' };
      }

      // Validate new password strength
      if (!validatePasswordStrength(newPassword)) {
        return {
          success: false,
          message:
            'Password must be at least 8 characters with uppercase, lowercase, number and special character.',
        };
      }

      // Update credentials
      ADMIN_CREDENTIALS.email = newEmail;
      ADMIN_CREDENTIALS.password = newPassword;
      ADMIN_CREDENTIALS.lastPasswordChange = new Date().toISOString();

      logSecurityEvent('CREDENTIALS_UPDATED', newEmail);

      // Force logout to require re-login with new credentials
      logout();

      return { success: true, message: 'Credentials updated successfully. Please login again.' };
    } catch (error) {
      console.error('Error updating credentials:', error);
      return { success: false, message: 'Failed to update credentials. Please try again.' };
    }
  };

  // Session timeout checker
  const startSessionTimeoutChecker = () => {
    if (window.sessionTimeoutInterval) clearInterval(window.sessionTimeoutInterval);

    window.sessionTimeoutInterval = setInterval(() => {
      const lastActivity = localStorage.getItem('last_activity');
      if (lastActivity) {
        const now = Date.now();
        const timeSinceActivity = now - parseInt(lastActivity);
        const sessionTimeout = SECURITY_CONFIG.sessionTimeoutMinutes * 60 * 1000;

        if (timeSinceActivity > sessionTimeout) {
          console.log('Session expired due to inactivity');
          logout();
        }
      }
    }, 60000); // Check every minute
  };

  // Update last activity timestamp
  const updateActivity = () => {
    if (authState.isAuthenticated) {
      localStorage.setItem('last_activity', Date.now().toString());
    }
  };

  // Password strength validation
  const validatePasswordStrength = (password: string): boolean => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChars;
  };

  // Security event logging
  const logSecurityEvent = (action: string, email: string) => {
    const securityLog = {
      timestamp: new Date().toISOString(),
      action,
      email,
      ip: 'CLIENT_SIDE', // In production, get from server
      userAgent: navigator.userAgent,
      sessionId: authState.sessionToken,
    };

    // Store in localStorage for now (in production, send to server)
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    existingLogs.push(securityLog);

    // Keep only last 100 logs
    const recentLogs = existingLogs.slice(-100);
    localStorage.setItem('security_logs', JSON.stringify(recentLogs));

    console.log('Security Event:', securityLog);
  };

  // Get security logs for admin review
  const getSecurityLogs = () => JSON.parse(localStorage.getItem('security_logs') || '[]');

  const value: AuthContextValue = {
    ...authState,
    login,
    logout,
    updateCredentials,
    updateActivity,
    getSecurityLogs,
    isPasswordExpired: () => {
      const lastChange = new Date(ADMIN_CREDENTIALS.lastPasswordChange);
      const now = new Date();
      const daysSinceChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceChange > SECURITY_CONFIG.passwordExpiryDays;
    },
    isLocked,
    lockoutEndTime,
    loginAttempts,
    remainingAttempts: Math.max(0, SECURITY_CONFIG.maxLoginAttempts - loginAttempts),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Extend window object for session timeout interval
declare global {
  interface Window {
    sessionTimeoutInterval?: NodeJS.Timeout;
  }
}

export { AuthContext };
