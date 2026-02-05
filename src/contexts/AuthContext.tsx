import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword, verifyPassword, generateSalt } from '@/lib/crypto';

interface AdminCredentials {
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  isFirstTimeSetup: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setupAdmin: (password: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  generateAuthFile: () => Promise<string>;
  loginWithFile: (fileContent: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'linux_admin_auth';
const ADMIN_CREDENTIALS_VERSION = 'admin_credentials_v1';
const ENCRYPTION_KEY = 'linux_admin_secret_key_2024';

// Simple encryption for the auth file
const encrypt = (text: string): string => {
  const encoded = btoa(text);
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
    return atob(result);
  } catch {
    return '';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);

  // Load credentials from Supabase on mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      // Query by version to find admin credentials
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
          
          // Check if user was previously logged in
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
    if (password.length < 6) {
      return false;
    }

    try {
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      
      const newCredentials: AdminCredentials = {
        passwordHash,
        salt,
        createdAt: new Date().toISOString()
      };

      // Insert new credentials record
      const { error } = await supabase
        .from('app_data')
        .insert({
          data: newCredentials as unknown as Record<string, never>,
          version: ADMIN_CREDENTIALS_VERSION,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving credentials:', error);
        return false;
      }

      setCredentials(newCredentials);
      setIsFirstTimeSetup(false);
      setIsAdmin(true);
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    } catch (err) {
      console.error('Error setting up admin:', err);
      return false;
    }
  };

  const login = async (password: string): Promise<boolean> => {
    if (!credentials) {
      return false;
    }

    try {
      const isValid = await verifyPassword(password, credentials.passwordHash, credentials.salt);
      if (isValid) {
        setIsAdmin(true);
        localStorage.setItem(AUTH_KEY, 'true');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error during login:', err);
      return false;
    }
  };

  const loginWithFile = async (fileContent: string): Promise<boolean> => {
    if (!credentials) {
      return false;
    }

    try {
      const decrypted = decrypt(fileContent.trim());
      const data = JSON.parse(decrypted);
      
      if (data.type === 'linux_admin_auth') {
        // Verify the password from the file
        const isValid = await verifyPassword(data.password, credentials.passwordHash, credentials.salt);
        if (isValid) {
          setIsAdmin(true);
          localStorage.setItem(AUTH_KEY, 'true');
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!credentials || newPassword.length < 6) {
      return false;
    }

    try {
      // Verify current password first
      const isValid = await verifyPassword(currentPassword, credentials.passwordHash, credentials.salt);
      if (!isValid) {
        return false;
      }

      // Generate new salt and hash for the new password
      const salt = generateSalt();
      const passwordHash = await hashPassword(newPassword, salt);
      
      const newCredentials: AdminCredentials = {
        passwordHash,
        salt,
        createdAt: credentials.createdAt
      };

      const { error } = await supabase
        .from('app_data')
        .update({
          data: newCredentials as unknown as Record<string, never>,
          updated_at: new Date().toISOString()
        })
        .eq('version', ADMIN_CREDENTIALS_VERSION);

      if (error) {
        console.error('Error updating password:', error);
        return false;
      }

      setCredentials(newCredentials);
      return true;
    } catch (err) {
      console.error('Error changing password:', err);
      return false;
    }
  };

  const generateAuthFile = async (): Promise<string> => {
    // Note: We can't include the actual password in the file since we only store the hash
    // Instead, we'll prompt the user to enter their password when generating the file
    // For now, return an empty string - this will need to be handled in the UI
    return '';
  };

  return (
    <AuthContext.Provider value={{ 
      isAdmin, 
      isLoading,
      isFirstTimeSetup,
      login, 
      loginWithFile,
      logout, 
      setupAdmin,
      changePassword, 
      generateAuthFile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
