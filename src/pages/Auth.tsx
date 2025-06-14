import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabaseClient';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showError, showSuccess } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تسجيل الدخول
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError('كل الحقول مطلوبة');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (loginError || !data.user) {
        throw new Error('بيانات الدخول غير صحيحة');
      }
      signIn({
        id: data.user.id,
        username: data.user.email, // أو أي اسم متاح
        email: data.user.email,
        profile_completed: false,
      });
      showSuccess('تم تسجيل الدخول بنجاح');
      navigate('/user-type');
    } catch (error: any) {
      setError(error.message || 'فشل تسجيل الدخول');
    } finally {
      setIsSubmitting(false);
    }
  };

  // التسجيل
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }
    if (!password) {
      setError('كلمة المرور مطلوبة');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError('هذا البريد الإلكتروني مستخدم مسبقاً');
        } else {
          setError(signUpError.message);
        }
        setIsSubmitting(false);
        return;
      }

      showSuccess('تم إنشاء الحساب بنجاح. يرجى تفعيل بريدك الإلكتروني ثم تسجيل الدخول.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsLogin(true);
    } catch (error: any) {
      setError(error.message || 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container flex flex-col bg-dots bg-noise">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.div 
            className="w-32 h-32 mx-auto mb-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <img 
              src="https://l.top4top.io/p_3343oc4gu1.png" 
              alt="شعار أجار" 
              className="w-full h-full object-contain"
            />
          </motion.div>
        </motion.div>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <h2 className="text-3xl font-bold mb-6 text-center text-gradient">تسجيل الدخول</h2>
              <form onSubmit={handleLogin} className="glass-morphism p-6 rounded-2xl">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <User className="w-5 h-5 text-secondary-400" />
                    </div>
                    <input
                      type="email"
                      className="input-field pr-12 text-left"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-5 h-5 text-secondary-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pr-12"
                      placeholder="أدخل كلمة المرور"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 flex items-center pl-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-secondary-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-secondary-400" />
                      )}
                    </button>
                  </div>
                </div>
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
                <p className="text-center text-secondary-600 dark:text-secondary-300">
                  ليس لديك حساب؟{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    إنشاء حساب
                  </button>
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <h2 className="text-3xl font-bold mb-6 text-center text-gradient">إنشاء حساب جديد</h2>
              <form onSubmit={handleRegister} className="glass-morphism p-6 rounded-2xl">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <User className="w-5 h-5 text-secondary-400" />
                    </div>
                    <input
                      type="email"
                      className="input-field pr-10"
                      placeholder="البريد الإلكتروني"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-5 h-5 text-secondary-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder="كلمة المرور"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 flex items-center pl-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-secondary-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-secondary-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-5 h-5 text-secondary-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder="تأكيد كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-modern w-full mb-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      <span>جاري إنشاء الحساب...</span>
                    </div>
                  ) : (
                    'إنشاء حساب'
                  )}
                </button>
                <p className="text-center text-secondary-600 dark:text-secondary-300">
                  لديك حساب بالفعل؟{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;