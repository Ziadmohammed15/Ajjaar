import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import bcrypt from 'bcryptjs';

interface RegisterFormProps {
  onRegister: (user: any) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!username) newErrors.username = 'اسم المستخدم مطلوب';
    if (!email) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'البريد الإلكتروني غير صحيح';
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (password !== confirmPassword) newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(password, 10);

      // إضافة المستخدم في جدول users
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            email,
            password: hashedPassword,
            profile_completed: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      onRegister(data);
    } catch (error: any) {
      setErrors({ general: error.message || 'حدث خطأ أثناء التسجيل' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleRegister}
      className="glass-morphism p-6 rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold mb-6 text-center">إنشاء حساب جديد</h2>
      <div className="mb-4">
        <label className="block mb-2">اسم المستخدم</label>
        <div className="relative">
          <User className="absolute right-3 top-3 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            className={`input-field pr-10 ${errors.username ? 'border-red-500' : ''}`}
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {errors.username && <p className="text-red-500">{errors.username}</p>}
      </div>
      <div className="mb-4">
        <label className="block mb-2">البريد الإلكتروني</label>
        <div className="relative">
          <Mail className="absolute right-3 top-3 w-5 h-5 text-secondary-400" />
          <input
            type="email"
            className={`input-field pr-10 ${errors.email ? 'border-red-500' : ''}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {errors.email && <p className="text-red-500">{errors.email}</p>}
      </div>
      <div className="mb-4">
        <label className="block mb-2">كلمة المرور</label>
        <div className="relative">
          <Lock className="absolute right-3 top-3 w-5 h-5 text-secondary-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute left-3 top-3">
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {errors.password && <p className="text-red-500">{errors.password}</p>}
      </div>
      <div className="mb-4">
        <label className="block mb-2">تأكيد كلمة المرور</label>
        <input
          type="password"
          className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && <p className="text-red-500">{errors.confirmPassword}</p>}
      </div>
      {errors.general && <p className="text-red-500">{errors.general}</p>}
      <button className="btn w-full mt-4" disabled={isSubmitting}>
        {isSubmitting ? 'جاري التسجيل...' : 'تسجيل'}
      </button>
      <p className="mt-4 text-center">
        لديك حساب؟{' '}
        <button type="button" className="text-blue-500 underline" onClick={onSwitchToLogin}>
          تسجيل الدخول
        </button>
      </p>
    </motion.form>
  );
};

export default RegisterForm;