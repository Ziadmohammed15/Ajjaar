import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, Mail, Camera, Check } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../context/ToastContext';

const CompleteProfile = () => {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [userType, setUserType] = useState<'client' | 'provider'>('client');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setLocation(profile.location || '');
      setUserType(profile.user_type || 'client');
      setAvatarUrl(profile.avatar_url || null);
    }
    setIsLoading(false);
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;
    setIsUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // First ensure the avatars bucket exists and has the correct policies
      const { data: bucketExists } = await supabase
        .storage
        .getBucket('avatars');

      if (!bucketExists) {
        await supabase
          .storage
          .createBucket('avatars', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
            fileSizeLimit: 1024 * 1024 * 2 // 2MB
          });
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showError('فشل في رفع الصورة الشخصية');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showError('الاسم مطلوب');
      return;
    }
    if (!user) {
      showError('يجب تسجيل الدخول أولاً');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar();
      }

      const updates = {
        id: user.id, // Ensure we're updating the correct profile
        name,
        email: email || null,
        location: location || null,
        user_type: userType,
        avatar_url: finalAvatarUrl,
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      showSuccess('تم تحديث الملف الشخصي بنجاح');
      
      if (userType === 'provider') {
        navigate('/provider/home');
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('فشل في تحديث الملف الشخصي');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="إكمال الملف الشخصي\" showBack={true} />
        <div className="page-container flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="إكمال الملف الشخصي" showBack={true} />
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism p-6 rounded-2xl"
        >
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary-100 dark:bg-secondary-800 border-4 border-white dark:border-secondary-700">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="الصورة الشخصية"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-secondary-400" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full shadow-lg cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                الصورة الشخصية (اختياري)
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                الاسم <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <User className="w-5 h-5 text-secondary-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pr-10"
                  placeholder="أدخل اسمك الكامل"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                نوع الحساب <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('client')}
                  className={`p-4 rounded-xl flex flex-col items-center justify-center ${
                    userType === 'client'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <User className="w-6 h-6 mb-2" />
                  <span>عميل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('provider')}
                  className={`p-4 rounded-xl flex flex-col items-center justify-center ${
                    userType === 'provider'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <User className="w-6 h-6 mb-2" />
                  <span>مقدم خدمة</span>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                البريد الإلكتروني (اختياري)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-secondary-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pr-10"
                  placeholder="أدخل بريدك الإلكتروني"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                الموقع (اختياري)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <MapPin className="w-5 h-5 text-secondary-400" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field pr-10"
                  placeholder="أدخل موقعك"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isUploading || !name}
              className="btn-modern w-full flex items-center justify-center"
            >
              {isSubmitting || isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 ml-2" />
                  <span>حفظ وإكمال</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default CompleteProfile;