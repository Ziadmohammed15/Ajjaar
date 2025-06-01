import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center mt-10">
        يجب تسجيل الدخول لعرض الملف الشخصي.
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center mt-10">
        لم يتم العثور على بيانات الملف الشخصي.<br />
        <button
          className="btn-primary mt-4"
          onClick={() => navigate("/complete-profile")}
        >
          إكمال الملف الشخصي
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow border">
      <h2 className="text-xl font-bold mb-6 text-center">الملف الشخصي</h2>
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary-100 dark:bg-secondary-800 border-4 border-white dark:border-secondary-700 mb-2">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="الصورة الشخصية"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-secondary-400 mx-auto my-auto" />
          )}
        </div>
        <p className="text-lg font-bold">{profile.name || "بدون اسم"}</p>
        <p className="text-secondary-600">{profile.email || "لا يوجد بريد إلكتروني"}</p>
        <p className="text-secondary-600">{profile.location || "لا يوجد موقع"}</p>
        <p className="text-secondary-600">
          {profile.user_type === "provider" ? "مقدم خدمة" : "عميل"}
        </p>
      </div>
      <button
        className="btn-primary w-full"
        onClick={() => navigate('/complete-profile')}
      >
        تعديل الملف الشخصي
      </button>
    </div>
  );
};

export default ProfilePage;