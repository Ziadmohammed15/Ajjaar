import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface UserType {
  id: string;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  accountType?: string;
  description?: string;
  profile_completed: boolean;
  avatar_url?: string;
}

interface ProfileType {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: 'client' | 'provider' | null;
  bio: string | null;
  location: string | null;
  phone_verified: boolean;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserType | null;
  profile: ProfileType | null;
  loading: boolean;
  isGuest: boolean;
  isProfileComplete: boolean;
  signIn: (user: UserType) => void;
  signOut: () => void;
  updateUser: (user: UserType) => void;
  setProfile: (profile: ProfileType | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }

          setProfile(data);
        } catch (error) {
          console.error('Error in profile fetch:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const signIn = (user: UserType) => {
    setUser(user);
    setIsGuest(false);
  };

  const signOut = () => {
    setUser(null);
    setProfile(null);
    setIsGuest(false);
  };

  const updateUser = (user: UserType) => setUser(user);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isGuest,
      isProfileComplete: profile?.is_profile_complete ?? false,
      signIn,
      signOut,
      updateUser,
      setProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};