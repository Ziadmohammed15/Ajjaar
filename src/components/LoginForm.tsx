import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import bcrypt from 'bcryptjs';

interface LoginFormProps {
  onLogin: (user: any) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!username || !password) {
      setErrors({ general: 'كل الحقول مطلوبة' });
      return;
    }
    setIsSubmitting(true);
    try {
      // جلب المستخدم بناءً على اسم المستخدم
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');

      // مقارنة كلمة المرور مع المخزن (bcrypt)
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');

      onLogin(user);
    } catch (error: any) {
      setErrors({ general: error.message || 'خطأ في تسجيل الدخول' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="glass-morphism p-6 rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold mb-6 text-center">تسجيل الدخول</h2>
      <div className="mb-4">
        <label className="block mb-2">اسم المستخدم</label>
        <div className="relative">
          <User className="absolute right-3 top-3 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            className="input-field pr-10"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="mb-6">
        <label className="block mb-2">كلمة المرور</label>
        <div className="relative">
          <Lock className="absolute right-3 top-3 w-5 h-5 text-secondary-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            className="input-field pr-10"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute left-3 top-3">
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>
      {errors.general && <p className="text-red-500">{errors.general}</p>}
      <button className="btn w-full mt-4" disabled={isSubmitting}>
        {isSubmitting ? 'جاري التحقق...' : 'دخول'}
      </button>
      <p className="mt-4 text-center">
        ليس لديك حساب؟{' '}
        <button type="button" className="text-blue-500 underline" onClick={onSwitchToRegister}>
          إنشاء حساب
        </button>
      </p>
    </motion.form>
  );
};

export default LoginForm;