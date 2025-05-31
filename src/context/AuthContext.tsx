import React, { createContext, useState, useContext } from 'react';

interface UserType {
  id: number;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  accountType?: string;
  description?: string;
  profile_completed: boolean;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserType | null;
  signIn: (user: UserType) => void;
  signOut: () => void;
  updateUser: (user: UserType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);

  const signIn = (user: UserType) => setUser(user);
  const signOut = () => setUser(null);
  const updateUser = (user: UserType) => setUser(user);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};