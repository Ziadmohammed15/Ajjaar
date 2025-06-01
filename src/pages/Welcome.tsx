import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Search, Star, ShieldCheck, LogIn } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  // عبارات متحركة
  const features = [
    {
      icon: <Search className="w-7 h-7 text-primary-500 mb-2" />,
      title: "ابحث عن الخدمة",
      desc: "ابحث بسهولة عن أفضل مقدمي الخدمات في جميع المجالات.",
    },
    {
      icon: <Star className="w-7 h-7 text-yellow-400 mb-2" />,
      title: "قيّم وشارك رأيك",
      desc: "شاهد التقييمات الحقيقية وشارك تجربتك مع الجميع.",
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-green-500 mb-2" />,
      title: "أمان وموثوقية",
      desc: "خدمات موثوقة وآمنة لجميع المستخدمين.",
    },
    {
      icon: <User className="w-7 h-7 text-secondary-500 mb-2" />,
      title: "إدارة حسابك بسهولة",
      desc: "تحكم كامل في بياناتك وخدماتك في أي وقت.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-secondary-900 px-4">
      {/* الشعار */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-6"
      >
        <img
          src="https://i.ibb.co/Kjh4T5Xz/2-6.png"
          alt="شعار أجار"
          style={{ width: 140, height: "auto" }}
          className="mx-auto"
        />
      </motion.div>

      {/* العنوان */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-extrabold mb-5 text-gradient text-center"
        style={{
          background: "linear-gradient(90deg, #1b83f5, #2ee59d)",
          WebkitBackgroundClip: "text",
          color: "transparent"
        }}
      >
        مرحبًا بك في أجّار!
      </motion.h1>

      {/* وصف متحرك مع أيقونات */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {features.map((feat, idx) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.2 }}
            className="bg-secondary-50 dark:bg-secondary-800 rounded-xl p-4 flex flex-col items-center shadow hover:scale-105 transition-transform duration-300"
          >
            {feat.icon}
            <span className="font-bold text-primary-600 dark:text-primary-300 mb-1">{feat.title}</span>
            <span className="text-sm text-secondary-600 dark:text-secondary-200 text-center">{feat.desc}</span>
          </motion.div>
        ))}
      </div>

      {/* زر تصفح الخدمات */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/home')}
        className="btn-primary w-64 py-3 text-lg font-bold shadow-lg mb-4"
        transition={{ delay: 0.6 }}
      >
        تصفح الخدمات
      </motion.button>
      {/* زر تسجيل الدخول أو إنشاء حساب */}
      <button
        onClick={() => navigate('/auth')}
        className="mt-2 text-primary-600 hover:underline flex items-center"
      >
        <LogIn className="ml-2" /> تسجيل الدخول أو إنشاء حساب
      </button>
    </div>
  );
};

export default Welcome;