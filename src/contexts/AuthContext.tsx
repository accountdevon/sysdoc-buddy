import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  loginWithFile: (fileContent: string) => boolean;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  resetToDefault: () => void;
  generateAuthFile: () => string;
  isDefaultPassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PASSWORD = 'admin123';
const AUTH_KEY = 'linux_admin_auth';
const PASSWORD_KEY = 'linux_admin_password';
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
  const [currentPassword, setCurrentPassword] = useState(DEFAULT_PASSWORD);
  const [isDefaultPassword, setIsDefaultPassword] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    const storedPassword = localStorage.getItem(PASSWORD_KEY);
    
    if (storedPassword) {
      setCurrentPassword(storedPassword);
      setIsDefaultPassword(storedPassword === DEFAULT_PASSWORD);
    }
    
    if (stored === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === currentPassword) {
      setIsAdmin(true);
      localStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  };

  const loginWithFile = (fileContent: string): boolean => {
    try {
      const decrypted = decrypt(fileContent.trim());
      const data = JSON.parse(decrypted);
      
      if (data.type === 'linux_admin_auth' && data.password === currentPassword) {
        setIsAdmin(true);
        localStorage.setItem(AUTH_KEY, 'true');
        return true;
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

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    if (oldPassword === currentPassword && newPassword.length >= 6) {
      setCurrentPassword(newPassword);
      setIsDefaultPassword(newPassword === DEFAULT_PASSWORD);
      localStorage.setItem(PASSWORD_KEY, newPassword);
      return true;
    }
    return false;
  };

  const resetToDefault = () => {
    setCurrentPassword(DEFAULT_PASSWORD);
    setIsDefaultPassword(true);
    localStorage.setItem(PASSWORD_KEY, DEFAULT_PASSWORD);
    setIsAdmin(false);
    localStorage.removeItem(AUTH_KEY);
  };

  const generateAuthFile = (): string => {
    const data = {
      type: 'linux_admin_auth',
      password: currentPassword,
      createdAt: new Date().toISOString()
    };
    return encrypt(JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ 
      isAdmin, 
      login, 
      loginWithFile,
      logout, 
      changePassword, 
      resetToDefault, 
      generateAuthFile,
      isDefaultPassword 
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
