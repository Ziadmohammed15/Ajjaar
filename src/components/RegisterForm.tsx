import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegisterFormProps {
  onRegister: (name: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name) newErrors.name = 'الاسم مطلوب';
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'البريد الإلكتروني غير صحيح';
    if (!password || password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (password !== confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // تنفيذ عملية التسجيل
      onRegister(name, email, password);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-gradient">إنشاء حساب جديد</h2>
      
      <form onSubmit={handleSubmit} className="glass-morphism p-6 rounded-2xl">
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2">الاسم الكامل</label>
          <div className="relative">
            <User className="absolute right-3 top-3 text-secondary-400 w-5 h-5" />
            <input
              id="name"
              type="text"
              className={`input-field pr-10 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="أدخل اسمك"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-3 top-3 text-secondary-400 w-5 h-5" />
            <input
              id="email"
              type="email"
              className={`input-field pr-10 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="block mb-2">كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-3 top-3 text-secondary-400 w-5 h-5" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="absolute left-3 top-3" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block mb-2">تأكيد كلمة المرور</label>
          <input
            id="confirmPassword"
            type="password"
            className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" className="btn-modern w-full mb-4" disabled={isSubmitting}>
          {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
        </button>

        <p className="text-center">
          لديك حساب؟{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-primary-500 hover:underline">
            تسجيل الدخول
          </button>
        </p>
      </form>
    </motion.div>
  );
};

export default RegisterForm;
