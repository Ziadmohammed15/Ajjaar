import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * مكون يُستخدم للتأكد أن المستخدم مكتمل الملف
 * إذا لم يكتمل، يوجهه لصفحة إكمال الملف
 */
const RequireCompleteProfile = ({ children }) => {
  const { isGuest, isProfileComplete, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && (isGuest || !isProfileComplete)) {
      navigate("/complete-profile");
    }
  }, [isGuest, isProfileComplete, loading, navigate]);

  if (loading) return null;
  if (isGuest || !isProfileComplete) return null;
  return children;
};

export default RequireCompleteProfile;