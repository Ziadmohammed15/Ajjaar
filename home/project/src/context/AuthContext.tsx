import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(getUser);
    return () => listener.subscription.unsubscribe();
  }, []);

  const isGuest = !user;
  const isProfileComplete = !!profile?.is_profile_complete;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isGuest,
      isProfileComplete,
      loading,
      setUser,
      setProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;