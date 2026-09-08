import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { apiClient } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  clinicId: string | null;
  doctorId: string | null;
  receptionistId: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem("MediNovel_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to load user session', error);
      localStorage.removeItem("MediNovel_token");
      localStorage.removeItem("MediNovel_refresh_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem("MediNovel_token", token);
    localStorage.setItem("MediNovel_refresh_token", refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("MediNovel_token");
      localStorage.removeItem("MediNovel_refresh_token");
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const role = user?.role || null;
  const clinicId = user?.clinic?.id || null;
  const doctorId = user?.doctor?.id || null;
  const receptionistId = user?.receptionist?.id || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        clinicId,
        doctorId,
        receptionistId,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
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
