import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfilePage = ({ userType }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return <div className="text-center mt-10">يجب تسجيل الدخول لعرض الملف الشخصي.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow border">
      <h2 className="text-xl font-bold mb-4 text-center">الملف الشخصي</h2>
      <div className="flex flex-col items-center mb-6">
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          alt="الصورة الشخصية"
          className="w-24 h-24 rounded-full object-cover mb-4"
        />
        <p className="text-lg font-bold">{profile.name}</p>
        <p className="text-secondary-600">{profile.email || "لا يوجد بريد إلكتروني"}</p>
        <p className="text-secondary-600">{profile.location || "لا يوجد موقع"}</p>
        <p className="text-secondary-600">{profile.user_type === "provider" ? "مقدم خدمة" : "عميل"}</p>
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