// ...استيراد الباقي كما هو
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editData, setEditData] = useState({
    phone: user?.phone ?? '',
    city: user?.city ?? '',
    accountType: user?.accountType ?? '',
    description: user?.description ?? '',
    avatar_url: user?.avatar_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    setSaving(true);
    try {
      // تحديث في قاعدة البيانات
      const { data, error } = await supabase
        .from('users')
        .update({
          ...editData,
          profile_completed:
            !!editData.phone &&
            !!editData.city &&
            !!editData.accountType &&
            !!editData.description, // أو حسب شروطك
        })
        .eq('id', user?.id)
        .select()
        .single();
      if (error) throw error;
      updateUser(data);
      alert('تم تحديث الملف الشخصي بنجاح');
    } catch (e: any) {
      alert(e.message || 'خطأ في التحديث');
    } finally {
      setSaving(false);
    }
  };

  // التوجيه لإكمال الملف عند محاولة نشر/طلب خدمة
  const tryPostService = () => {
    if (!user?.profile_completed) {
      alert('يرجى إكمال الملف الشخصي أولاً!');
      navigate('/profile');
    } else {
      navigate('/post-service');
    }
  };

  // باقي الكود لعرض وتعديل البيانات...

  return (
    <div>
      {/* عرض وتعديل الهاتف، المدينة، نوع الحساب، الوصف، الصورة ... */}
      <button onClick={handleSave} disabled={saving}>
        حفظ التعديلات
      </button>
      {/* مثال على زر نشر خدمة */}
      <button onClick={tryPostService}>
        نشر خدمة
      </button>
    </div>
  );
};

export default ProfilePage;