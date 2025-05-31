import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!username) newErrors.username = 'الاسم مطلوب';
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // محاكاة استجابة API
      onLogin(username, password);
    } catch (error) {
      console.error('Login error:', error);
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
      <h2 className="text-3xl font-bold mb-6 text-center text-gradient">تسجيل الدخول</h2>
      <form onSubmit={handleSubmit} className="glass-morphism p-6 rounded-2xl">
        {/* اسم المستخدم */}
        <div className="mb-4">
          <label htmlFor="username" className="block mb-2">اسم المستخدم</label>
          <div className="relative">
            <User className="absolute right-3 top-3 text-secondary-400 w-5 h-5" />
            <input
              id="username"
              type="text"
              className={`input-field pr-10 ${errors.username ? 'border-red-500' : ''}`}
              placeholder="أدخل اسمك"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
        </div>

        {/* كلمة المرور */}
        <div className="mb-6">
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
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute left-3 top-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        {/* زر الدخول */}
        <button
          type="submit"
          className="btn-modern w-full mb-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
              <span>جاري تسجيل الدخول...</span>
            </div>
          ) : (
            'تسجيل الدخول'
          )}
        </button>

        {/* الانتقال لإنشاء حساب */}
        <p className="text-center text-secondary-600 dark:text-secondary-300">
          ليس لديك حساب؟{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
          >
            إنشاء حساب
          </button>
        </p>
      </form>
    </motion.div>
  );
};

export default LoginForm;
