import React from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-secondary-900">
      <h1 className="text-4xl font-bold mb-8 text-gradient">مرحبًا بك في أجّار!</h1>
      <p className="mb-8 text-lg text-secondary-700 dark:text-secondary-200 text-center">
        يمكنك تصفح جميع الخدمات والطلبات بدون تسجيل دخول.<br />
        إذا أردت إضافة خدمة أو طلب، سنطلب منك تسجيل الدخول وإكمال بياناتك فقط عند الحاجة.
      </p>
      <button
        onClick={() => navigate('/home')}
        className="btn-primary mb-4 w-64"
      >
        تصفح الخدمات
      </button>
      <button
        onClick={() => navigate('/auth')}
        className="btn-secondary w-64"
      >
        تسجيل الدخول / حساب جديد
      </button>
    </div>
  );
};
export default Welcome;