import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // ممكن يكون null (زائر) أو user object
  const [profile, setProfile] = useState(null); // بيانات البروفايل من قاعدة البيانات
  const [loading, setLoading] = useState(true);

  // تحميل بيانات المستخدم عند فتح التطبيق أو تغيير الجلسة
  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // جلب بيانات البروفايل من جدول profiles
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
    // استمع لأي تغييرات في الجلسة (تسجيل دخول/خروج)
    const { data: listener } = supabase.auth.onAuthStateChange(getUser);
    return () => listener.subscription.unsubscribe();
  }, []);

  // هل المستخدم زائر؟
  const isGuest = !user;
  // هل الملف الشخصي مكتمل؟
  const isProfileComplete = !!profile?.is_profile_complete;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isGuest,
      isProfileComplete,
      loading,
      setUser,
      setProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);