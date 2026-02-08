import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { SessionWarningDialog } from '@/components/SessionWarningDialog';

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  isFirstTimeSetup: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setupAdmin: (password: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  generateResetKey: (currentPassword: string) => Promise<string | null>;
  generateAuthFile: (currentPassword: string) => Promise<string | null>;
  resetPasswordWithKey: (fileContent: string, newPassword: string) => Promise<boolean>;
  loginWithFile: (fileContent: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'linux_admin_session';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callAuthEndpoint(action: string, params: Record<string, unknown> = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action, ...params }),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  const logout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const { showWarning, countdown, stayLoggedIn } = useAutoLogout(isAdmin, logout);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const sessionToken = sessionStorage.getItem(SESSION_KEY);
      
      if (sessionToken) {
        // Validate the session server-side
        const res = await callAuthEndpoint('validate-session', { sessionToken });
        const data = await res.json();
        if (data.valid) {
          setIsAdmin(true);
          setIsFirstTimeSetup(false);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          setIsFirstTimeSetup(data.isFirstTimeSetup ?? false);
        }
      } else {
        // Just check if admin is set up
        const res = await callAuthEndpoint('check-status');
        const data = await res.json();
        setIsFirstTimeSetup(data.isFirstTimeSetup);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      setIsFirstTimeSetup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setupAdmin = async (password: string): Promise<boolean> => {
    if (password.length < 6) return false;
    try {
      const res = await callAuthEndpoint('setup', { password });
      const data = await res.json();
      if (data.success) {
        setIsFirstTimeSetup(false);
        setIsAdmin(true);
        sessionStorage.setItem(SESSION_KEY, data.sessionToken);
        return true;
      }
      return false;
    } catch (err) { console.error('Error setting up admin:', err); return false; }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const res = await callAuthEndpoint('login', { password });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        sessionStorage.setItem(SESSION_KEY, data.sessionToken);
        return true;
      }
      return false;
    } catch (err) { console.error('Error during login:', err); return false; }
  };

  const loginWithFile = async (fileContent: string): Promise<boolean> => {
    try {
      const res = await callAuthEndpoint('login-with-file', { fileContent });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        sessionStorage.setItem(SESSION_KEY, data.sessionToken);
        return true;
      }
      return false;
    } catch { return false; }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (newPassword.length < 6) return false;
    try {
      const res = await callAuthEndpoint('change-password', { currentPassword, newPassword });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(SESSION_KEY, data.sessionToken);
        return true;
      }
      return false;
    } catch (err) { console.error('Error changing password:', err); return false; }
  };

  const generateResetKey = async (currentPassword: string): Promise<string | null> => {
    try {
      const res = await callAuthEndpoint('generate-reset-key', { currentPassword });
      const data = await res.json();
      return data.success ? data.key : null;
    } catch { return null; }
  };

  const generateAuthFile = async (currentPassword: string): Promise<string | null> => {
    try {
      const res = await callAuthEndpoint('generate-auth-file', { currentPassword });
      const data = await res.json();
      return data.success ? data.key : null;
    } catch { return null; }
  };

  const resetPasswordWithKey = async (fileContent: string, newPassword: string): Promise<boolean> => {
    if (newPassword.length < 6) return false;
    try {
      const res = await callAuthEndpoint('reset-password-with-key', { fileContent, newPassword });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        sessionStorage.setItem(SESSION_KEY, data.sessionToken);
        return true;
      }
      return false;
    } catch { return false; }
  };

  return (
    <AuthContext.Provider value={{ 
      isAdmin, isLoading, isFirstTimeSetup,
      login, loginWithFile, logout, setupAdmin,
      changePassword, generateResetKey, generateAuthFile, resetPasswordWithKey
    }}>
      {children}
      <SessionWarningDialog 
        open={showWarning} 
        countdown={countdown} 
        onStayLoggedIn={stayLoggedIn} 
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
