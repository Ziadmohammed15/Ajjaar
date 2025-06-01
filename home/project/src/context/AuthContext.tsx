import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Profile type for strong typing
interface Profile {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  avatar_url?: string;
  user_type?: 'client' | 'provider';
  is_profile_complete?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  phoneVerified: boolean;
  isProfileComplete: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any }>;
  signUp: (phone: string, userData: any) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ error: any }>;
  setPhoneVerified: (verified: boolean) => void;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  sendPhoneVerification: (phone: string) => Promise<{ success: boolean, error: any }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ success: boolean, error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // isProfileComplete is true if profile exists and is_profile_complete flag is true
  const isProfileComplete = !!profile?.is_profile_complete;

  // --- Auth & Profile Bootstrap ---
  useEffect(() => {
    const getSessionAndProfile = async () => {
      setLoading(true);

      const { data: authResult } = await supabase.auth.getSession();
      setSession(authResult.session);
      setUser(authResult.session?.user ?? null);

      if (authResult.session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authResult.session.user.id)
          .single();
        setProfile(profileData);
        setPhoneVerified(!!profileData?.phone_verified);
      } else {
        setProfile(null);
        setPhoneVerified(false);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            setPhoneVerified(!!data?.phone_verified);
          });
      } else {
        setProfile(null);
        setPhoneVerified(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Auth Functions ---

  const signInWithPhone = async (phone: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);

      // Load or create profile after successful login
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          phone: phone,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setPhoneVerified(!!profileData?.phone_verified);

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (phone: string, userData: any) => {
    try {
      // Create user with Supabase
      const { data, error } = await supabase.auth.signUp({
        phone: phone,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: phone
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('فشل إنشاء المستخدم');

      // Create profile after user creation
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: userData.name,
          phone: phone,
          phone_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      setProfile({
        id: data.user.id,
        name: userData.name,
        phone: phone,
        phone_verified: false,
      });

      return { error: null, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error, user: null };
    }
  };

  const sendPhoneVerification = async (phone: string) => {
    try {
      const response = await fetch('/api/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      return { success: false, error: 'Failed to send verification code' };
    }
  };

  const verifyPhoneCode = async (phone: string, code: string) => {
    try {
      const response = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await response.json();
      if (data.success) setPhoneVerified(true);
      return { success: data.success, error: data.error };
    } catch (error) {
      return { success: false, error: 'Failed to verify code' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setPhoneVerified(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(updatedProfile);

      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      phoneVerified,
      isProfileComplete,
      signInWithPhone,
      signUp,
      signOut,
      updateProfile,
      setPhoneVerified,
      setProfile,
      sendPhoneVerification,
      verifyPhoneCode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};