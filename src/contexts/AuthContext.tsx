import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword, verifyPassword, generateSalt } from '@/lib/crypto';
import { useAutoLogout } from '@/hooks/useAutoLogout';

interface AdminCredentials {
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface ResetKeyData {
  type: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  generatedAt: string;
}

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  isFirstTimeSetup: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setupAdmin: (password: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  generateResetKey: (currentPassword: string) => Promise<string | null>;
  resetPasswordWithKey: (fileContent: string, newPassword: string) => Promise<boolean>;
  loginWithFile: (fileContent: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'linux_admin_auth';
const ADMIN_CREDENTIALS_VERSION = 'admin_credentials_v1';
const ENCRYPTION_KEY = 'linux_admin_secret_key_2024';

const encrypt = (text: string): string => {
  const encoded = btoa(unescape(encodeURIComponent(text)));
  let result = '';
  for (let i = 0; i < encoded.length; i++) {
    const charCode = encoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
};

const decrypt = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return decodeURIComponent(escape(atob(result)));
  } catch {
    return '';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);

  const logout = useCallback(() => {
    setIsAdmin(false);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  // Auto-logout after 10 minutes of inactivity
  useAutoLogout(isAdmin, logout);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('app_data')
        .select('id, data')
        .eq('version', ADMIN_CREDENTIALS_VERSION)
        .maybeSingle();

      if (error) {
        console.error('Error loading credentials:', error);
        setIsFirstTimeSetup(true);
      } else if (data && data.data) {
        const creds = data.data as unknown as AdminCredentials;
        if (creds.passwordHash && creds.salt) {
          setCredentials(creds);
          setIsFirstTimeSetup(false);
          const stored = localStorage.getItem(AUTH_KEY);
          if (stored === 'true') {
            setIsAdmin(true);
          }
        } else {
          setIsFirstTimeSetup(true);
        }
      } else {
        setIsFirstTimeSetup(true);
      }
    } catch (err) {
      console.error('Error loading credentials:', err);
      setIsFirstTimeSetup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setupAdmin = async (password: string): Promise<boolean> => {
    if (password.length < 6) return false;
    try {
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const newCredentials: AdminCredentials = { passwordHash, salt, createdAt: new Date().toISOString() };

      const { error } = await supabase
        .from('app_data')
        .insert({
          data: newCredentials as unknown as Record<string, never>,
          version: ADMIN_CREDENTIALS_VERSION,
          updated_at: new Date().toISOString()
        });

      if (error) { console.error('Error saving credentials:', error); return false; }
      setCredentials(newCredentials);
      setIsFirstTimeSetup(false);
      setIsAdmin(true);
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    } catch (err) { console.error('Error setting up admin:', err); return false; }
  };

  const login = async (password: string): Promise<boolean> => {
    if (!credentials) return false;
    try {
      const isValid = await verifyPassword(password, credentials.passwordHash, credentials.salt);
      if (isValid) { setIsAdmin(true); localStorage.setItem(AUTH_KEY, 'true'); return true; }
      return false;
    } catch (err) { console.error('Error during login:', err); return false; }
  };

  const loginWithFile = async (fileContent: string): Promise<boolean> => {
    if (!credentials) return false;
    try {
      const decrypted = decrypt(fileContent.trim());
      const data = JSON.parse(decrypted);
      if (data.type === 'linux_admin_auth' && data.passwordHash === credentials.passwordHash && data.salt === credentials.salt) {
        setIsAdmin(true);
        localStorage.setItem(AUTH_KEY, 'true');
        return true;
      }
      return false;
    } catch { return false; }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!credentials || newPassword.length < 6) return false;
    try {
      const isValid = await verifyPassword(currentPassword, credentials.passwordHash, credentials.salt);
      if (!isValid) return false;

      const salt = generateSalt();
      const passwordHash = await hashPassword(newPassword, salt);
      const newCredentials: AdminCredentials = { passwordHash, salt, createdAt: credentials.createdAt };

      const { error } = await supabase
        .from('app_data')
        .update({ data: newCredentials as unknown as Record<string, never>, updated_at: new Date().toISOString() })
        .eq('version', ADMIN_CREDENTIALS_VERSION);

      if (error) { console.error('Error updating password:', error); return false; }
      setCredentials(newCredentials);
      return true;
    } catch (err) { console.error('Error changing password:', err); return false; }
  };

  // Generate an encrypted reset key file containing the current password hash
  const generateResetKey = async (currentPassword: string): Promise<string | null> => {
    if (!credentials) return null;
    try {
      const isValid = await verifyPassword(currentPassword, credentials.passwordHash, credentials.salt);
      if (!isValid) return null;

      const resetData: ResetKeyData = {
        type: 'linux_admin_reset_key',
        passwordHash: credentials.passwordHash,
        salt: credentials.salt,
        createdAt: credentials.createdAt,
        generatedAt: new Date().toISOString()
      };

      return encrypt(JSON.stringify(resetData));
    } catch { return null; }
  };

  // Reset password using the encrypted key file
  const resetPasswordWithKey = async (fileContent: string, newPassword: string): Promise<boolean> => {
    if (newPassword.length < 6) return false;
    try {
      const decrypted = decrypt(fileContent.trim());
      const data = JSON.parse(decrypted) as ResetKeyData;

      if (data.type !== 'linux_admin_reset_key') return false;

      // Load current credentials from DB to verify the key matches
      const { data: dbData, error: fetchError } = await supabase
        .from('app_data')
        .select('data')
        .eq('version', ADMIN_CREDENTIALS_VERSION)
        .maybeSingle();

      if (fetchError || !dbData) return false;
      const currentCreds = dbData.data as unknown as AdminCredentials;

      // Verify the key matches current credentials
      if (data.passwordHash !== currentCreds.passwordHash || data.salt !== currentCreds.salt) {
        return false; // Key is outdated (password was changed after key was generated)
      }

      // Set new password
      const salt = generateSalt();
      const passwordHash = await hashPassword(newPassword, salt);
      const newCredentials: AdminCredentials = { passwordHash, salt, createdAt: currentCreds.createdAt };

      const { error } = await supabase
        .from('app_data')
        .update({ data: newCredentials as unknown as Record<string, never>, updated_at: new Date().toISOString() })
        .eq('version', ADMIN_CREDENTIALS_VERSION);

      if (error) return false;
      setCredentials(newCredentials);
      setIsAdmin(true);
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    } catch { return false; }
  };

  return (
    <AuthContext.Provider value={{ 
      isAdmin, isLoading, isFirstTimeSetup,
      login, loginWithFile, logout, setupAdmin,
      changePassword, generateResetKey, resetPasswordWithKey
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
