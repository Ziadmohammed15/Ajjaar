import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    username: '',
    phone: '',
    city: '',
    accountType: '',
    description: '',
  });
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profile) {
          setUserData(profile);
          setProfileCompleted(profile.profile_completed);
        }
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const updatedProfile = {
      ...userData,
      profile_completed: true,
    };
    const { error } = await supabase
      .from('users')
      .update(updatedProfile)
      .eq('username', userData.username);

    if (!error) {
      setMessage('✅ تم تحديث الملف الشخصي بنجاح');
      setProfileCompleted(true);
    } else {
      setMessage('❌ حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">ملفك الشخصي</h2>

      <label className="block mb-2">رقم الهاتف:</label>
      <input
        type="text"
        name="phone"
        value={userData.phone}
        onChange={handleChange}
        className="input-field mb-4"
      />

      <label className="block mb-2">المدينة:</label>
      <input
        type="text"
        name="city"
        value={userData.city}
        onChange={handleChange}
        className="input-field mb-4"
      />

      <label className="block mb-2">نوع الحساب:</label>
      <select
        name="accountType"
        value={userData.accountType}
        onChange={handleChange}
        className="input-field mb-4"
      >
        <option value="">اختر نوع الحساب</option>
        <option value="provider">مقدم خدمة</option>
        <option value="seeker">طالب خدمة</option>
      </select>

      <label className="block mb-2">وصف قصير (اختياري):</label>
      <textarea
        name="description"
        value={userData.description}
        onChange={handleChange}
        className="input-field mb-4"
      />

      <button className="btn-modern w-full" onClick={handleSave}>
        حفظ الملف الشخصي
      </button>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
};

export default ProfilePage;
