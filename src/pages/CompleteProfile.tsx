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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

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
    if (!user || !user.id) {
      showError('يجب تسجيل الدخول أولاً أو لا يوجد معرف مستخدم!');
      return;
    }
    console.log('Supabase user id:', user.id);

    setIsSubmitting(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar();
      }

      const updates = {
        id: user.id,
        name,
        email: email || null,
        location: location || null,
        user_type: userType,
        avatar_url: finalAvatarUrl,
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      };

      console.log('Sending profile data:', updates);

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' }) // الصح هنا فقط 'id'
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        showError(
          error.message === 'new row violates row-level security policy for table "profiles"'
            ? 'ليس لديك صلاحية تعديل هذا الحساب أو أن السياسات غير مفعلة بشكل صحيح في قاعدة البيانات.'
            : 'فشل في تحديث الملف الشخصي: ' + error.message
        );
        return;
      }

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
        <Header title="إكمال الملف الشخصي" showBack={true} />
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
            {/* ... باقي الكود كما هو ... */}
            {/* لم يتم تغييره */}
            {/* ... */}
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default CompleteProfile;