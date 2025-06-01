import React, { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Check } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, profile, setProfile } = useAuth();
  const [editData, setEditData] = useState({
    phone: profile?.phone ?? "",
    city: profile?.location ?? "",
    accountType: profile?.user_type ?? "",
    description: profile?.bio ?? "",
    avatar_url: profile?.avatar_url ?? "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setEditData({
        phone: profile.phone ?? "",
        city: profile.location ?? "",
        accountType: profile.user_type ?? "",
        description: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile]);

  const handleInput = (key: string, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setEditData(prev => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return editData.avatar_url;
    const ext = avatarFile.name.split('.').pop();
    const filePath = `${user.id}/profile_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalAvatar = editData.avatar_url;
      if (avatarFile) {
        const url = await uploadAvatar();
        if (url) finalAvatar = url;
      }
      // تحقق من اكتمال الحقول الأساسية
      const isProfileComplete =
        !!editData.phone &&
        !!editData.city &&
        !!editData.accountType &&
        !!editData.description;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          phone: editData.phone,
          location: editData.city,
          user_type: editData.accountType,
          bio: editData.description,
          avatar_url: finalAvatar,
          is_profile_complete: isProfileComplete,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      alert('تم تحديث الملف الشخصي بنجاح');
    } catch (e: any) {
      alert(e.message || 'خطأ في التحديث');
    } finally {
      setSaving(false);
    }
  };

  // التوجيه لإكمال الملف عند محاولة نشر/طلب خدمة
  const tryPostService = () => {
    if (!profile?.is_profile_complete) {
      alert('يرجى إكمال الملف الشخصي أولاً!');
      navigate('/complete-profile');
    } else {
      navigate('/provider/add-service');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow border">
      <h2 className="text-xl font-bold mb-4 text-center">الملف الشخصي</h2>
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary-100 dark:bg-secondary-800 border-4 border-white dark:border-secondary-700">
            {editData.avatar_url ? (
              <img
                src={editData.avatar_url}
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
      </div>
      <label className="block text-sm font-medium text-secondary-700 mb-2">رقم الجوال</label>
      <input
        type="text"
        value={editData.phone}
        onChange={e => handleInput('phone', e.target.value)}
        className="input-field mb-4"
        placeholder="05xxxxxxxx"
      />
      <label className="block text-sm font-medium text-secondary-700 mb-2">المدينة</label>
      <input
        type="text"
        value={editData.city}
        onChange={e => handleInput('city', e.target.value)}
        className="input-field mb-4"
        placeholder="مثال: الرياض"
      />
      <label className="block text-sm font-medium text-secondary-700 mb-2">نوع الحساب</label>
      <select
        value={editData.accountType}
        onChange={e => handleInput('accountType', e.target.value)}
        className="input-field mb-4"
      >
        <option value="">اختر نوع الحساب</option>
        <option value="client">عميل</option>
        <option value="provider">مقدم خدمة</option>
      </select>
      <label className="block text-sm font-medium text-secondary-700 mb-2">الوصف</label>
      <textarea
        value={editData.description}
        onChange={e => handleInput('description', e.target.value)}
        className="input-field mb-4"
        placeholder="نبذة عنك"
        rows={3}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full mb-4 flex items-center justify-center"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
            <span>جاري الحفظ...</span>
          </>
        ) : (
          <>
            <Check className="w-5 h-5 ml-2" />
            <span>حفظ التعديلات</span>
          </>
        )}
      </button>
      {/* مثال على زر نشر خدمة */}
      <button onClick={tryPostService} className="btn-modern w-full">
        نشر خدمة
      </button>
    </div>
  );
};

export default ProfilePage;