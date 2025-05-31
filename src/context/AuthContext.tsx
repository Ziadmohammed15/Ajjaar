import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  phoneVerified: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any }>;
  signUp: (phone: string, name: string, password: string) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ error: any }>;
  setPhoneVerified: (verified: boolean) => void;
  sendPhoneVerification: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  setPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkPhoneVerified(session.user.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkPhoneVerified(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const checkPhoneVerified = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone_verified')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      setPhoneVerified(data?.phone_verified || false);
    } catch (error) {
      console.error('Error checking phone verification status:', error);
    }
  };

  const signInWithPhone = async (phone: string, password: string) => {
    try {
      // Format phone number if needed
      let formattedPhone = phone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Sign in with phone and password
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password: password
      });

      if (error) throw error;
      
      // Check if phone is verified
      if (data.user) {
        await checkPhoneVerified(data.user.id);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (phone: string, name: string, password: string) => {
    try {
      // Format phone number if needed
      let formattedPhone = phone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Create user with phone and password
      const { data, error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password: password,
        options: {
          data: {
            name: name,
            phone: formattedPhone
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to create user');

      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name: name,
          phone: formattedPhone,
          phone_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;
      
      return { error: null, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error, user: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setPhoneVerified(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (data: any) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      setUser(prev => ({
        ...prev!,
        user_metadata: {
          ...prev!.user_metadata,
          ...data
        }
      }));
      
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };
  
  const sendPhoneVerification = async (phone: string) => {
    try {
      let formattedPhone = phone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ phoneNumber: formattedPhone })
      });

      const data = await response.json();
      if (data.success) {
        console.log(`Verification code sent to ${formattedPhone}`);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Failed to send verification code' 
        };
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };
  
  const verifyPhoneCode = async (phone: string, code: string) => {
    try {
      let formattedPhone = phone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-check`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          phoneNumber: formattedPhone, 
          code 
        })
      });

      const data = await response.json();
      if (data.success) {
        setPhoneVerified(true);
        
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              phone: formattedPhone,
              phone_verified: true 
            })
            .eq('id', user.id);
        }
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Invalid verification code'
        };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  const setPassword = async (password: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error setting password:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading,
      phoneVerified,
      signInWithPhone,
      signUp, 
      signOut, 
      updateProfile,
      setPhoneVerified,
      sendPhoneVerification,
      verifyPhoneCode,
      setPassword
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